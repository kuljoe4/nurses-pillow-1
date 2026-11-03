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

    # For speed and stability on this test, let's just log in via the standard developer bypass
    print("Logging into a brand new user using developer bypass...")

    # In App.tsx, there's no direct developer bypass for empty user, but there is one for super_admin
    # Wait, the issue was with New Users having mock data. I fixed NurseDashboardView to only show mock data if activeBookings.length > 0.
    # When a new user logs in, activeBookings is empty. So we just need to log in as ANY new user.
    # We can sign up. Let's do it via the API directly using page.evaluate to fetch

    print("Registering new user via fetch...")
    rand_int = random.randint(10000, 99999)
    email = f"alice.new.{rand_int}@example.com"

    page.evaluate(f"""
        fetch('/api/auth/register', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ email: '{email}', password: 'Password123!', fullName: 'Alice New', role: 'nurse' }})
        }}).then(res => res.json()).then(data => {{
            if (data.token) localStorage.setItem('np_auth_token', data.token);
            window.location.reload();
        }});
    """)

    page.wait_for_timeout(3000)

    print("Opening Auth Modal to login with new credentials...")
    # Actually if reload doesn't auto-log in, let's just use the login form.
    join_button = page.locator('button:has-text("Sign In")').first
    if join_button.count() > 0:
        join_button.click()
        page.locator('input[type="email"]').first.fill(email)
        page.locator('input[type="password"]').first.fill("Password123!")
        page.locator('button:has-text("Sign In to Sanctuary Hub")').click()

        page.wait_for_timeout(2000)

    print("Clicking My Bookings to go to Nurse Dashboard...")
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
