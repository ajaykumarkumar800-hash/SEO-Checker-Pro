"""
SEO Checker Pro — Flask Application
"""

from flask import Flask, render_template, request, jsonify
from seo_analyzer import SEOAnalyzer

app = Flask(__name__)


@app.route("/")
def launch():
    """Serve the welcome launching page."""
    return render_template("launch.html")


@app.route("/scanner")
def index():
    """Serve the main scanner interface."""
    return render_template("index.html")


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Run SEO analysis on the provided URL."""
    data = request.get_json()
    if not data or not data.get("url"):
        return jsonify({"success": False, "error": "Please provide a URL to analyze."}), 400

    url = data["url"].strip()
    keyword = data.get("keyword", "").strip()
    if not url:
        return jsonify({"success": False, "error": "URL cannot be empty."}), 400

    try:
        analyzer = SEOAnalyzer(url, focus_keyword=keyword)
        report = analyzer.analyze()
        return jsonify(report)
    except Exception as e:
        return jsonify({"success": False, "error": f"Analysis error: {str(e)}"}), 500


@app.route("/api/compare", methods=["POST"])
def compare():
    """Compare two URLs side-by-side."""
    data = request.get_json()
    url1 = (data.get("url1") or "").strip()
    url2 = (data.get("url2") or "").strip()
    if not url1 or not url2:
        return jsonify({"success": False, "error": "Two URLs are required."}), 400
    try:
        a1 = SEOAnalyzer(url1)
        a2 = SEOAnalyzer(url2)
        r1 = a1.analyze()
        r2 = a2.analyze()
        # Build comparison highlights
        comparison = {}
        if r1.get("success") and r2.get("success"):
            for cat in r1.get("category_scores", {}):
                s1 = r1["category_scores"][cat]["score"]
                s2 = r2["category_scores"][cat]["score"]
                comparison[cat] = {
                    "name": r1["category_scores"][cat]["name"],
                    "score1": s1, "score2": s2,
                    "diff": s1 - s2,
                    "winner": "url1" if s1 > s2 else ("url2" if s2 > s1 else "tie"),
                }
        return jsonify({
            "success": True, "report1": r1, "report2": r2,
            "comparison": comparison,
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Comparison error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
