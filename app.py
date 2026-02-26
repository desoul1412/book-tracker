import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd

# --- CONFIG ---
st.set_page_config(page_title="Book Tracker Web", layout="wide")

# This is your "Robot's" email. 
# It comes automatically from the secrets you pasted in Step 2.
BOT_EMAIL = st.secrets["gcp_service_account"]["client_email"]

# --- AUTH FUNCTION ---
def connect_to_sheet(sheet_url):
    try:
        # Create a "Scope" (Permissions)
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        
        # Load credentials directly from Streamlit Secrets (Server-side security)
        creds_dict = dict(st.secrets["gcp_service_account"])
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        
        client = gspread.authorize(creds)
        
        # Open by URL
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e:
        return None, str(e)

# --- SIDEBAR: CONNECTION ---
st.sidebar.title("🔗 Connect Your Sheet")

st.sidebar.info(f"""
**Step 1:** Share your Google Sheet with this email (Copy it):
""")
st.sidebar.code(BOT_EMAIL, language="text")

st.sidebar.info("""
**Step 2:** Paste your Google Sheet Link below:
""")
sheet_url = st.sidebar.text_input("Google Sheet URL")

if st.sidebar.button("Connect"):
    if sheet_url:
        sheet, error = connect_to_sheet(sheet_url)
        if sheet:
            st.session_state['sheet_conn'] = sheet
            st.session_state['sheet_url'] = sheet_url
            st.sidebar.success("✅ Connected!")
        else:
            st.sidebar.error(f"Error: {error}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        sheet = st.session_state['sheet_conn']
        # Assume "Form Responses" is the tab name
        worksheet = sheet.worksheet("Form Responses")
        data = worksheet.get_all_records()
        df = pd.DataFrame(data)

        st.title(f"📚 {sheet.title}")

        # --- GRID VIEW ---
        if not df.empty:
            # Layout: 5 columns
            cols = st.columns(5)
            for idx, row in df.iterrows():
                col = cols[idx % 5]
                with col:
                    # --- FIXED IMAGE LOGIC ---
                    raw_img = row.get('Cover URL')
                    
                    # Check: Is it a string? Is it not empty? Does it start with http?
                    if isinstance(raw_img, str) and len(raw_img) > 5 and raw_img.startswith("http"):
                        img = raw_img
                    else:
                        # Use placeholder if URL is empty or broken
                        img = "https://via.placeholder.com/150?text=No+Cover"

                    st.image(img, use_container_width=True)
                    # -------------------------
            
                    if st.button(f"📖 {row.get('Title','Untitled')}", key=f"btn_{idx}"):
                        st.session_state['selected_book'] = row
                        st.session_state['row_index'] = idx + 2 
                        st.rerun()

        # --- EDIT MODAL ---
        if 'selected_book' in st.session_state:
            book = st.session_state['selected_book']
            
            @st.dialog(f"Edit: {book['Title']}")
            def edit_dialog():
                col1, col2 = st.columns([1,2])
                with col1:
                    st.image(book.get('Cover URL', ''))
                    # Status Dropdown
                    status_opts = ["To Read", "Reading", "Read"]
                    curr_status = book.get('Reading Status', 'To Read')
                    new_status = st.selectbox("Status", status_opts, index=status_opts.index(curr_status) if curr_status in status_opts else 0)
                
                with col2:
                    new_review = st.text_area("Review", value=str(book.get('My Review', '')))
                
                if st.button("Save to Google Sheet"):
                    # Update specific cells (Row, Col)
                    # Adjust column numbers to match your template!
                    worksheet.update_cell(st.session_state['row_index'], 10, new_status) # Col 10 = J
                    worksheet.update_cell(st.session_state['row_index'], 20, new_review) # Col 20 = T
                    st.success("Saved!")
                    st.rerun()
            
            edit_dialog()

    except Exception as e:
        st.error("Lost connection. Please reconnect.")
        st.write(e)

else:
    # --- LANDING PAGE ---
    st.header("Welcome to the Book Tracker Web App")
    st.markdown("""
    This app connects directly to **your** Google Sheet. We don't see your data.
    
    1. **Make a Copy** of the [Official Template](YOUR_TEMPLATE_LINK).
    2. Follow the instructions in the sidebar to connect.
    """)
