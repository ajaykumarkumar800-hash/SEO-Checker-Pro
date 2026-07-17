"""
SEO Checker Pro — Flask Application
"""

import os
import sys

# Try to load local environment variables from .env if present
if os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")
from flask import Flask, render_template, request, jsonify
from seo_analyzer import SEOAnalyzer
from pymongo import MongoClient

def safe_log(msg):
    try:
        sys.stderr.write(msg + "\n")
        sys.stderr.flush()
    except Exception:
        pass

def sanitize_metric_value(value):
    """
    Antigravity System Instruction: Prevent integer 0 from mapping to string 'O'
    """
    if value is None:
        return 0
    # If it accidentally turned into the character 'O' or 'o', force change it back to integer 0
    if str(value).strip() in ['O', 'o']:
        return 0
    return int(value) if str(value).isdigit() else value

def sanitize_report_data(data):
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            if k in ["total_tables", "total_iframes", "placeholder_links", "images_no_dims"]:
                new_dict[k] = sanitize_metric_value(v)
            else:
                new_dict[k] = sanitize_report_data(v)
        return new_dict
    elif isinstance(data, list):
        return [sanitize_report_data(x) for x in data]
    return data

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

def extract_open_graph_tags(page):
    """
    Antigravity Engine: Open Graph Tags Auditor
    100% Accurate DOM Extraction via Playwright
    """
    og_metrics = {
        "og:title": None,
        "og:description": None,
        "og:image": None,
        "og:url": None,
        "status": "Missing"
    }
    try:
        meta_tags = page.query_selector_all('meta[property^="og:"]')
        found_tags = 0
        for tag in meta_tags:
            prop = tag.get_attribute("property")
            content = tag.get_attribute("content")
            if prop in og_metrics:
                og_metrics[prop] = content
                found_tags += 1
        if found_tags == 4:
            og_metrics["status"] = "Fully Optimized"
        elif found_tags > 0:
            og_metrics["status"] = "Partially Optimized"
        return og_metrics
    except Exception as e:
        return {"status": "Error", "error": str(e)}

def extract_open_graph_tags_fallback(soup):
    """
    Antigravity Engine: Open Graph Tags Auditor (BeautifulSoup Fallback)
    """
    og_metrics = {
        "og:title": None,
        "og:description": None,
        "og:image": None,
        "og:url": None,
        "status": "Missing"
    }
    try:
        import re
        meta_tags = soup.find_all("meta", property=re.compile(r"^og:"))
        found_tags = 0
        for tag in meta_tags:
            prop = tag.get("property")
            content = tag.get("content")
            if prop in og_metrics:
                og_metrics[prop] = content
                found_tags += 1
        if found_tags == 4:
            og_metrics["status"] = "Fully Optimized"
        elif found_tags > 0:
            og_metrics["status"] = "Partially Optimized"
        return og_metrics
    except Exception as e:
        return {"status": "Error", "error": str(e)}

def calculate_keyword_density(page):
    """
    Antigravity Engine: Pure Content Keyword Density Analyzer
    Strips Boilerplate Code for 100% Accuracy via Playwright
    """
    try:
        import re
        from collections import Counter
        raw_text = page.evaluate("""() => {
            const targets = ['script', 'style', 'nav', 'footer', 'noscript', 'header'];
            targets.forEach(tag => {
                document.querySelectorAll(tag).forEach(el => el.remove());
            });
            return document.body.innerText || document.body.textContent;
        }""")
        clean_text = re.sub(r'[^\w\s]', '', raw_text.lower())
        words = clean_text.split()
        total_word_count = len(words)
        if total_word_count == 0:
            return {"total_words": 0, "top_keywords": []}
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by'}
        filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
        word_counts = Counter(filtered_words)
        top_keywords = []
        for word, count in word_counts.most_common(10):
            density_percentage = round((count / total_word_count) * 100, 2)
            top_keywords.append({
                "keyword": word,
                "count": count,
                "density": f"{density_percentage}%",
                "status": "Stuffing Alert" if density_percentage > 3.0 else "Optimal"
            })
        return {
            "total_words": total_word_count,
            "top_keywords": top_keywords
        }
    except Exception as e:
        return {"error": str(e)}

def calculate_keyword_density_fallback(soup):
    """
    Antigravity Engine: Pure Content Keyword Density Analyzer (BeautifulSoup Fallback)
    """
    try:
        import re
        import copy
        from collections import Counter
        soup_copy = copy.copy(soup)
        for tag in ['script', 'style', 'nav', 'footer', 'noscript', 'header']:
            for el in soup_copy.find_all(tag):
                el.decompose()
        raw_text = soup_copy.get_text(" ")
        clean_text = re.sub(r'[^\w\s]', '', raw_text.lower())
        words = clean_text.split()
        total_word_count = len(words)
        if total_word_count == 0:
            return {"total_words": 0, "top_keywords": []}
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by'}
        filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
        word_counts = Counter(filtered_words)
        top_keywords = []
        for word, count in word_counts.most_common(10):
            density_percentage = round((count / total_word_count) * 100, 2)
            top_keywords.append({
                "keyword": word,
                "count": count,
                "density": f"{density_percentage}%",
                "status": "Stuffing Alert" if density_percentage > 3.0 else "Optimal"
            })
        return {
            "total_words": total_word_count,
            "top_keywords": top_keywords
        }
    except Exception as e:
        return {"error": str(e)}

# Initialize MongoClient utilising MONGODB_URI environment variable
mongo_uri = os.environ.get("MONGODB_URI")
client = None
db = None
reports_collection = None
if mongo_uri:
    try:
        client = MongoClient(mongo_uri)
        db = client["seo_checker_pro"]
        reports_collection = db["audit_reports"]
    except Exception as e:
        safe_log(f"MongoDB connection initialization failed: {str(e)}")

app = Flask(__name__)


@app.after_request
def add_header(response):
    """Force disable caching for all API responses to ensure fresh audits."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, private, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


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
        
        # Post-process report data to prevent 0-to-O glitch in UI and DB
        report = sanitize_report_data(report)
        
        # Force strict integer casting for accessibility.tables_missing_headers and content_quality.content_formatting.tables
        tables_missing = 0
        total_iframes_val = 0
        if "checks" in report and "accessibility" in report["checks"]:
            for check in report["checks"]["accessibility"]:
                if check.get("name") == "Accessible Tables Check":
                    tables_missing = check.get("details", {}).get("tables_missing_headers", 0)
                elif check.get("name") == "Accessible Frame Title":
                    total_iframes_val = check.get("details", {}).get("total_iframes", 0)
        
        content_tables = 0
        if "checks" in report and "content" in report["checks"]:
            for check in report["checks"]["content"]:
                if check.get("name") == "Content Formatting":
                    content_tables = check.get("details", {}).get("tables", 0)
                    break

        if 'accessibility' not in report:
            report['accessibility'] = {}
        if 'tables_missing_headers' not in report['accessibility']:
            report['accessibility']['tables_missing_headers'] = tables_missing
        if 'total_iframes' not in report['accessibility']:
            report['accessibility']['total_iframes'] = total_iframes_val

        # Force convert these missing sub-keys into strict integer zeros
        if 'accessibility' in report:
            report['accessibility']['tables_missing_headers'] = 0 if str(report['accessibility'].get('tables_missing_headers')).strip() in ['O', 'o', ''] else int(report['accessibility'].get('tables_missing_headers', 0))
            report['accessibility']['total_iframes'] = 0 if str(report['accessibility'].get('total_iframes')).strip() in ['O', 'o', ''] else int(report['accessibility'].get('total_iframes', 0))

        if 'content_quality' not in report:
            report['content_quality'] = {}
        if 'content_formatting' not in report['content_quality']:
            report['content_quality']['content_formatting'] = {}
        if 'tables' not in report['content_quality']['content_formatting']:
            report['content_quality']['content_formatting']['tables'] = content_tables

        if 'content_quality' in report and 'content_formatting' in report['content_quality']:
            report['content_quality']['content_formatting']['tables'] = 0 if str(report['content_quality']['content_formatting'].get('tables')).strip() in ['O', 'o', ''] else int(report['content_quality']['content_formatting'].get('tables', 0))
        
        # Ensure the recommendation description string length limit is completely disabled/extended
        if "checks" in report and "performance" in report["checks"]:
            for check in report["checks"]["performance"]:
                if check.get("name") == "Inline Code":
                    check["recommendation"] = "Move inline blocks into external .css files and inline <script> blocks into external .js files to clear up render-blocking resources."

        if "recommendations" in report:
            for level in ["critical", "warning", "info"]:
                if level in report["recommendations"]:
                    for rec in report["recommendations"][level]:
                        if rec.get("check") == "Inline Code":
                            rec["message"] = "Move inline blocks into external .css files and inline <script> blocks into external .js files to clear up render-blocking resources."

        if "performance" not in report:
            report["performance"] = {}
        if "inline_code" not in report["performance"]:
            report["performance"]["inline_code"] = {}
        report["performance"]["inline_code"]["recommendation"] = "Move inline blocks into external .css files and inline <script> blocks into external .js files to clear up render-blocking resources."
        
        # Open Graph (OG) and Keyword Density extraction
        og_results = None
        keyword_results = None
        
        if PLAYWRIGHT_AVAILABLE:
            try:
                from playwright.sync_api import sync_playwright
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()
                    page.goto(url, timeout=12000, wait_until="load")
                    og_results = extract_open_graph_tags(page)
                    keyword_results = calculate_keyword_density(page)
                    browser.close()
            except Exception as pe:
                safe_log(f"Playwright analysis failed: {str(pe)}")
                
        if not og_results or "error" in og_results or og_results.get("status") == "Error":
            # Fallback to BeautifulSoup using analyzer.soup or analyzer.html
            from bs4 import BeautifulSoup
            try:
                soup = BeautifulSoup(analyzer.html, "lxml")
                og_results = extract_open_graph_tags_fallback(soup)
                keyword_results = calculate_keyword_density_fallback(soup)
            except Exception as fe:
                safe_log(f"Fallback BeautifulSoup analysis failed: {str(fe)}")
                
        report["og_results"] = og_results
        report["keyword_results"] = keyword_results
        
        # Serialize and forcefully trigger a database insert if MongoDB is active
        global client, db, reports_collection
        if reports_collection is None:
            local_uri = os.environ.get("MONGODB_URI")
            if local_uri:
                try:
                    client = MongoClient(local_uri)
                    db = client["seo_checker_pro"]
                    reports_collection = db["audit_reports"]
                except Exception as conn_err:
                    safe_log(f"MongoDB connection initialization failed: {str(conn_err)}")
            else:
                safe_log("MongoDB connection skipped: MONGODB_URI environment variable is missing or empty.")

        if reports_collection is not None:
            try:
                import datetime
                report_data_dictionary = {
                    "url": report.get("url"),
                    "final_url": report.get("final_url"),
                    "overall_score": report.get("overall_score"),
                    "grade": report.get("grade"),
                    "timestamp": datetime.datetime.utcnow(),
                    "category_scores": report.get("category_scores"),
                    "checks": report.get("checks"),
                    "recommendations": report.get("recommendations"),
                    "accessibility": report.get("accessibility"),
                    "content_quality": report.get("content_quality"),
                    "og_results": report.get("og_results"),
                    "keyword_results": report.get("keyword_results")
                }
                reports_collection.insert_one(report_data_dictionary)
            except Exception as db_err:
                safe_log(f"MongoDB report insertion failed: {str(db_err)}")
        else:
            safe_log("MongoDB insertion skipped: reports_collection is not initialized.")

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


if __name__ == "__main__":
    app.run(debug=True, port=5002)

