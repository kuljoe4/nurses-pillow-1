from playwright.sync_api import Page, sync_playwright
import time
import random

def verify_empty_dashboard(page: Page):
    print("Navigating to local server...")
    page.goto("http://localhost:3000")

    print("Bypassing staging gate...")
    page.get_by_placeholder("Username").fill("lawrence")
    page.get_by_placeholder("Password").fill("np-preview-2026")
    page.get_by_role("button", name="Sign in", exact=True).click()

    # Wait for the main UI to load
    page.wait_for_timeout(3000)

    try:
        user_menu_btn = page.locator('button:has-text("Sarah Jenkins, RN")')
        if user_menu_btn.count() > 0:
            print("Auto-logged into mock account. Logging out...")
            user_menu_btn.click()
            page.wait_for_timeout(500)
            page.locator('button:has-text("Log Out")').first.click()
            page.wait_for_selector('button:has-text("Confirm & Log Out")', timeout=5000)
            page.click('button:has-text("Confirm & Log Out")')
            page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Exception during logout check: {e}")

    # Wait for the "Sign In" button which opens AuthModal
    print("Opening Auth Modal...")
    join_button = page.locator('button:has-text("Sign In")').first
    join_button.wait_for(state="visible", timeout=10000)
    join_button.click()

    # The modal opens in "signin" mode by default. Switch to signup.
    print("Switching to Sign Up mode...")
    page.locator('button:has-text("Create Sanctuary Account")').click()

    # Take a screenshot to see if the form fields rendered properly
    page.wait_for_timeout(1000)

    print("Filling sign-up form...")
    rand_int = random.randint(1000, 9999)
    email = f"alice.wonder{rand_int}@example.com"

    page.locator('input[placeholder="Sarah Jenkins"]').fill("Alice Wonder")
    page.locator('input[placeholder="sarah.jenkins@alumni.duke.edu"]').fill(email)

    # Let's find inputs sequentially in the signup modal
    inputs = page.locator('.flex-1.overflow-y-auto input').all()
    # 0 = fullName
    # 1 = email
    # 2 = phone
    # 3 = password
    if len(inputs) >= 4:
        inputs[2].fill("1234567890")
        inputs[3].fill("StrongP@ssw0rd1!")
    else:
        # Fallback
        page.locator('input[type="password"]').first.fill("StrongP@ssw0rd1!")

    # Submit the form by pressing enter
    print("Submitting form...")
    page.keyboard.press("Enter")

    print("Waiting for Verification Step...")
    code_element = page.wait_for_selector('text=/Preview note: Verification PIN is/', timeout=10000)
    code_text = code_element.inner_text()

    import re
    match = re.search(r'is\s+(\d+)', code_text)
    if match:
        code = match.group(1)
    else:
        raise Exception("Could not find code")

    print(f"Extracted PIN: {code}")

    print("Entering PIN...")
    inputs = page.locator('input[type="text"]').all()
    for i, char in enumerate(code):
         if i < len(inputs):
             inputs[i].fill(char)

    print("Clicking Verify email...")
    page.click('button:has-text("Verify email")')

    print("Clicking My Bookings to go to Nurse Dashboard...")
    page.wait_for_timeout(2000)
    page.get_by_text("My Bookings").first.click()

    print("Waiting for dashboard to stabilize...")
    page.wait_for_timeout(3000)

    print("Taking screenshot...")
    page.screenshot(path="empty_dashboard_final.png")

    print("Verifying absence of mock data...")
    assert page.get_by_text("No active sanctuary stays").is_visible(), "Should show empty active bookings"

    print("Verification complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_empty_dashboard(page)
        finally:
            browser.close()
