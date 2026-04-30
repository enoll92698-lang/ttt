#!/usr/bin/env python3
"""
Daily Economic News Summarizer
Runs at 8:00 AM JST. Gathers news from multiple sources via web search,
then summarizes with neutral, multi-perspective analysis in Japanese.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

import anthropic

JST = timezone(timedelta(hours=9))
REPORTS_DIR = Path(__file__).parent.parent / "reports"

SEARCH_QUERIES = [
    "world economic news today 2026",
    "global stock market today Nikkei S&P500 NASDAQ",
    "USD JPY EUR exchange rate today",
    "oil gold price today commodity market",
    "US Federal Reserve monetary policy 2026",
    "Bank of Japan BOJ policy interest rate 2026",
    "China economy GDP trade 2026",
    "Europe ECB economy inflation 2026",
    "Japan economy trade balance GDP 2026",
    "IMF World Bank economic outlook 2026",
    "日本経済ニュース 本日 2026",
    "世界経済 今日 株価 為替",
]

SYSTEM_PROMPT = """あなたは世界経済の専門アナリストです。
以下のルールを厳守して経済ニュースサマリーを日本語で作成してください：

1. **中立性**: 特定の国家・政党・企業・イデオロギーに肩入れせず、客観的事実のみを述べること
2. **多角的視点**: 各トピックについて、異なる立場・地域・経済学派の見方を必ず提示すること
3. **複数ソース**: 政府公式発表、金融機関データ、メディア報道など複数の情報源を参照・明記すること
4. **データ重視**: 具体的な数値（株価、レート、成長率等）を積極的に引用すること
5. **私情排除**: 「〜すべき」「〜は良い/悪い」などの価値判断を含まず、事実と異なる視点を並列提示すること
6. **構造化**: 見出し・箇条書きを使い、読みやすく整理すること

出力形式はMarkdownで記述すること。"""

ANALYSIS_PROMPT = """
今日（{date}）の世界経済ニュースを以下の構成でまとめてください。
提供した検索結果を参照し、複数のソースから情報を統合してください。

# 📊 世界経済ニュース日次サマリー — {date}

## 1. 主要市場データ（今日の数値）
- 株式指数：日経平均、S&P500、NASDAQ、DOW、DAX、上海総合等
- 為替：USD/JPY、EUR/JPY、EUR/USD、CNY/JPY等
- 商品：原油(WTI/Brent)、金、銅等

## 2. 本日の主要経済トピック（3〜5件）
各トピックにつき：
- **概要**：何が起きたか（事実のみ）
- **賛成・支持する見方**：どの立場がどう評価するか
- **懸念・批判する見方**：どの立場がどう評価するか
- **参照ソース**：政府発表/中央銀行/国際機関/メディア等

## 3. 地域別経済動向
### 🇯🇵 日本
### 🇺🇸 米国
### 🇪🇺 欧州
### 🇨🇳 中国・アジア

## 4. 注目指標・今後の予定
今週・来週に発表される重要経済指標やイベント

## 5. アナリスト総評
複数の経済機関・専門家の見解を並列提示（賛否両論を含む）

---
*本レポートは複数の公開情報源を基に作成した情報提供目的のサマリーです。投資判断の根拠として使用しないでください。*
*参照: Reuters, Bloomberg, NHK, 財務省, 日本銀行, Fed, ECB, IMF, World Bank, Yahoo Finance等*
"""


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )
    return logging.getLogger(__name__)


def gather_news_with_web_search(client: anthropic.Anthropic, logger: logging.Logger) -> str:
    """Use Claude with web_search tool to gather economic news from multiple sources."""
    logger.info("Gathering economic news via web search...")

    search_results = []

    for query in SEARCH_QUERIES:
        logger.info(f"Searching: {query}")
        try:
            response = client.messages.create(
                model="claude-opus-4-7",
                max_tokens=2000,
                tools=[{"type": "web_search_20250305", "name": "web_search"}],
                tool_choice={"type": "auto"},
                messages=[
                    {
                        "role": "user",
                        "content": f"Search for: {query}\n\nReturn the key facts, numbers, and source names found.",
                    }
                ],
            )

            # Extract text from response
            result_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    result_text += block.text

            if result_text.strip():
                search_results.append(f"### Query: {query}\n{result_text}\n")

        except Exception as e:
            logger.warning(f"Search failed for '{query}': {e}")
            continue

    combined = "\n\n".join(search_results)
    logger.info(f"Gathered {len(search_results)} search result sets ({len(combined)} chars)")
    return combined


def generate_summary(client: anthropic.Anthropic, search_data: str, date_str: str, logger: logging.Logger) -> str:
    """Generate a neutral, multi-perspective economic summary using gathered data."""
    logger.info("Generating economic news summary...")

    prompt = ANALYSIS_PROMPT.format(date=date_str) + f"\n\n## 収集した情報\n\n{search_data}"

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


def save_report(summary: str, date_str: str, logger: logging.Logger) -> Path:
    """Save the report as a markdown file."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"{date_str}.md"

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(summary)

    logger.info(f"Report saved: {report_path}")
    return report_path


def print_report(summary: str):
    """Print report to stdout."""
    print("\n" + "=" * 80)
    print(summary)
    print("=" * 80 + "\n")


def main():
    logger = setup_logging()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY environment variable is not set.")
        sys.exit(1)

    now_jst = datetime.now(JST)
    date_str = now_jst.strftime("%Y-%m-%d")
    logger.info(f"Starting daily economic news summary for {date_str} (JST)")

    client = anthropic.Anthropic(api_key=api_key)

    search_data = gather_news_with_web_search(client, logger)

    summary = generate_summary(client, search_data, date_str, logger)

    report_path = save_report(summary, date_str, logger)
    print_report(summary)

    logger.info(f"Done. Report: {report_path}")


if __name__ == "__main__":
    main()
