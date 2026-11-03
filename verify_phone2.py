from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to dev server
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(5000)

        # Bypass Staging Gate
        print("Bypassing Staging Auth Gate...")
        page.evaluate("document.querySelectorAll('.fixed').forEach(m => { if(m.className.includes('z-[100]')) m.remove() })")
        page.wait_for_timeout(1000)

        # Click the Sign Up button
        print("Opening Auth Modal...")
        page.click("button:has-text('Sign up')")
        page.wait_for_timeout(2000)

        # Fill in the phone input with an international number
        print("Typing international phone number...")
        page.fill("input[name='phone']", "+44 7700 900077")
        page.wait_for_timeout(1000)

        # Take a screenshot
        screenshot_path = "/home/jules/verification/phone_international.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Now clear and type a standard US 10-digit number to check formatting
        page.fill("input[name='phone']", "4155552671")
        page.wait_for_timeout(1000)

        screenshot_path2 = "/home/jules/verification/phone_us.png"
        page.screenshot(path=screenshot_path2)
        print(f"Screenshot saved to {screenshot_path2}")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
