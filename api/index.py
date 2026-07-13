"""
SEO Checker Pro — Vercel Serverless Entrypoint
"""

import sys
import os
# Ensure root directory is in sys.path for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify
from seo_analyzer import SEOAnalyzer
from pymongo import MongoClient

# Initialize MongoClient utilising MONGODB_URI environment variable
mongo_uri = os.environ.get("MONGODB_URI")
client = None
reports_collection = None
if mongo_uri:
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        # Map database named 'seo_checker_pro' and collection named 'audit_reports'
        db = client["seo_checker_pro"]
        reports_collection = db["audit_reports"]
    except Exception as e:
        sys.stderr.write(f"MongoDB connection initialization failed: {str(e)}\n")

app = Flask(__name__, template_folder='../templates', static_folder='../static')


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
    raw_cat = data.get("website_category")
    if raw_cat is None:
        raw_cat = data.get("category")
    
    # Strictly validate 'technical' selection to prevent reversion to default 'general'
    if raw_cat is not None and str(raw_cat).strip().lower() == "technical":
        category = "technical"
    else:
        category = "general"
    if not url:
        return jsonify({"success": False, "error": "URL cannot be empty."}), 400

    try:
        analyzer = SEOAnalyzer(url, focus_keyword=keyword, website_category=category)
        report = analyzer.analyze()
        
        # Serialize and forcefully trigger a database insert if MongoDB is active
        global reports_collection
        if reports_collection is None:
            local_uri = os.environ.get("MONGODB_URI")
            if local_uri:
                try:
                    local_client = MongoClient(local_uri, serverSelectionTimeoutMS=2000)
                    local_db = local_client["seo_checker_pro"]
                    reports_collection = local_db["audit_reports"]
                except Exception:
                    pass

        if reports_collection is not None:
            try:
                import datetime
                report_data_dictionary = {
                    "url": report.get("url"),
                    "final_url": report.get("final_url"),
                    "overall_score": report.get("overall_score"),
                    "grade": report.get("grade"),
                    "timestamp": datetime.datetime.utcnow(),
                    "category_scores": report.get("category_scores")
                }
                reports_collection.insert_one(report_data_dictionary)
            except Exception as db_err:
                sys.stderr.write(f"MongoDB report insertion failed: {str(db_err)}\n")

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
@app.route("/api/gsc-live-audit", methods=["POST"])
def gsc_live_audit():
    """Verify live HTTP status of a list of GSC URLs concurrently."""
    data = request.get_json()
    if not data or not data.get("urls"):
        return jsonify({"success": True, "results": {}})
    
    urls = data["urls"]
    # Restrict to first 100 to prevent server overload
    urls = urls[:100]
    
    import concurrent.futures
    import requests
    
    results = {}
    
    def check_url(url):
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            }
            # Make a fast HEAD request (follow redirects to check final status)
            r = requests.head(url, timeout=4, allow_redirects=True, headers=headers)
            if r.status_code in [403, 404, 405, 412, 500, 501, 502, 503, 504] or r.status_code >= 400:
                r = requests.get(url, timeout=4, allow_redirects=True, stream=True, headers=headers)
            
            # Check redirect history
            is_redirected = len(r.history) > 0
            
            return url, {
                "status_code": r.status_code,
                "is_redirected": is_redirected,
                "final_url": r.url
            }
        except Exception:
            return url, {
                "status_code": 0, # Timeout/Connection error
                "is_redirected": False,
                "final_url": url
            }

    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        futures_to_url = {executor.submit(check_url, url): url for url in urls}
        for future in concurrent.futures.as_completed(futures_to_url):
            try:
                url, res = future.result()
                results[url] = res
            except Exception:
                pass
                
    return jsonify({"success": True, "results": results})



# For local testing
if __name__ == "__main__":
    app.run(debug=True, port=5000)
