import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime
import time # Added for delays if needed

# --- CONFIG ---
st.set_page_config(page_title="My Book Shelf", layout="wide", page_icon="📚")

# --- CUSTOM CSS ---
st.markdown("""
<style>
    /* 1. UNIFORM COVERS */
    div[data-testid="stImage"] img {
        height: 300px !important;
        object-fit: cover !important;
        border-radius: 8px;
        width: 100% !important;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    /* 2. TITLE BUTTON STYLING */
    div[data-testid="stButton"] button {
        width: 100%;
        border: none !important;
        background: transparent !important;
        color: #2d3748 !important;
        font-weight: 800 !important;
        font-size: 15px !important;
        text-align: center !important;
        padding: 5px 0 !important;
        margin-top: 5px !important;
        white-space: nowrap !important; 
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }
    div[data-testid="stButton"] button:hover {
        color: #5b8aed !important;
    }

    /* 3. MODAL HEADER */
    .book-header {
        background-color: #5b8aed;
        color: white;
        padding: 15px;
        text-align: center;
        font-family: 'Arial', sans-serif;
        font-weight: bold;
        font-size: 24px;
        border-radius: 8px 8px 0 0;
        margin-bottom: 20px;
        text-transform: uppercase;
    }

    /* 4. SIDEBAR STYLING */
    button[kind="primary"] {
        background-color: #5b8aed !important;
        border: none !important;
        color: white !important;
        font-weight: bold !important;
        transition: 0.3s;
    }
    button[kind="primary"]:hover {
        background-color: #4a7ac9 !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    /* 5. DELETE BUTTON STYLING */
    button[kind="secondary"] {
        border-color: #fc8181 !important;
        color: #c53030 !important;
    }
    button[kind="secondary"]:hover {
        background-color: #fff5f5 !important;
        border-color: #c53030 !important;
    }
    
    /* 6. CLEANUP */
    .css-15zrgzn {display: none}
    div[data-testid="stFeedback"] { justify-content: center; }
</style>
""", unsafe_allow_html=True)

# --- AUTH SETUP ---
creds_dict = None
bot_email = "Unavailable (Check Secrets)"

try:
    if "gcp_service_account" in st.secrets:
        creds_dict = dict(st.secrets["gcp_service_account"])
        bot_email = creds_dict["client_email"]
    else:
        import toml
        with open(".streamlit/secrets.toml", "r") as f:
            data = toml.load(f)
            creds_dict = data["gcp_service_account"]
            bot_email = creds_dict["client_email"]
except Exception:
    pass

def connect_to_sheet(sheet_url):
    if not creds_dict:
        return None, "Credentials not found."
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        client = gspread.authorize(creds)
        sheet = client.open_by_url(sheet_url)
        return sheet, None
    except Exception as e:
        return None, str(e)

# --- SIDEBAR ---
st.sidebar.title("📚 My Book Shelf")

if 'sheet_conn' not in st.session_state:
    st.sidebar.markdown("### 🔌 Connect")
    
    st.sidebar.info("**Step 1:** Share your Google Sheet with this email:")
    st.sidebar.code(bot_email, language="text")
    
    st.sidebar.info("**Step 2:** Paste your Google Sheet Link below:")
    sheet_url = st.sidebar.text_input("Sheet URL", placeholder="https://docs.google.com/...", label_visibility="collapsed")
    
    st.sidebar.markdown("---")
    
    if st.sidebar.button("🔌 Connect Library", type="primary"):
        if sheet_url:
            sheet, error = connect_to_sheet(sheet_url)
            if sheet:
                st.session_state['sheet_conn'] = sheet
                st.session_state['sheet_url'] = sheet_url
                st.rerun()
            else:
                st.sidebar.error(f"Failed: {error}")
else:
    if st.sidebar.button("🔄 Refresh Data"):
        st.cache_data.clear()
        st.rerun()
    
    # --- ADD BOOK (UPDATED WITH AUTO-CLEAR) ---
    with st.sidebar.expander("➕ Add Book", expanded=False):
        # NOTE: clear_on_submit=True is the magic command here
        with st.form("add_book_form", clear_on_submit=True):
            new_title = st.text_input("Title *")
            new_author = st.text_input("Author *")
            new_cover = st.text_input("Cover URL")
            new_status = st.selectbox("Status", ["To Read", "Reading", "Read", "DNF"])
            
            # Form Submit Button
            submitted = st.form_submit_button("Add")
            
            if submitted:
                try:
                    sheet = st.session_state['sheet_conn']
                    
                    # 1. Target correct sheet
                    target_ws = None
                    for ws in sheet.worksheets():
                        if "form responses" in ws.title.lower():
                            target_ws = ws
                            break
                    if not target_ws: target_ws = sheet.get_worksheet(0)

                    # 2. Get Headers
                    headers = target_ws.row_values(1)
                    new_row = [""] * len(headers) 

                    def get_idx(name):
                        for i, h in enumerate(headers):
                            if h.strip().lower() == name.lower():
                                return i
                        return -1

                    # 3. Map Data
                    idx_time = get_idx("Timestamp")
                    if idx_time >= 0: new_row[idx_time] = str(datetime.now())

                    idx_title = get_idx("Title")
                    if idx_title >= 0: new_row[idx_title] = new_title

                    idx_auth = get_idx("Author")
                    if idx_auth >= 0: new_row[idx_auth] = new_author

                    idx_stat = get_idx("Reading Status")
                    if idx_stat >= 0: new_row[idx_stat] = new_status

                    idx_cover = get_idx("Cover URL")
                    if idx_cover == -1: idx_cover = get_idx("URL #1")
                    if idx_cover >= 0: new_row[idx_cover] = new_cover

                    # 4. Append
                    target_ws.append_row(new_row)
                    
                    # 5. Success Message & Reset
                    st.toast(f"✅ Book added successfully!", icon="🎉")
                    st.cache_data.clear()
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"Error adding book: {e}")

# --- MAIN APP ---
if 'sheet_conn' in st.session_state:
    try:
        sheet = st.session_state['sheet_conn']
        
        # READ DATA
        target_ws = None
        for ws in sheet.worksheets():
            if "form responses" in ws.title.lower():
                target_ws = ws
                break
        if not target_ws: target_ws = sheet.get_worksheet(0)
        
        data = target_ws.get_all_records()
        df = pd.DataFrame(data)

        # MAPPING
        col_map = {
            "Title": "Title",
            "Author": "Author",
            "Status": "Reading Status",
            "Cover": "Cover URL",
            "Cover_Alt": "URL #1",
            "Rating": "Rating",
            "Source": "Source",
            "Primary": "Primary Genre",
            "Secondary": "Secondary Genre(s)",
            "Tropes": "Tropes",
            "Owned": "Owned?",
            "Review": "Reviews",
            "Format": "Format",
            "Date": "Date Finished",
            "Series": "Series Name",
            "SeriesNum": "Number in Series",
            "Timestamp": "Timestamp"
        }

        if col_map["Title"] not in df.columns:
            st.error(f"Error: Column '{col_map['Title']}' not found in sheet.")
            st.stop()
            
        df = df[df[col_map["Title"]].astype(str).str.strip() != '']
        df['real_row_index'] = df.index + 2 

        st.title(f"📖 {sheet.title}")

        # --- FILTERS ---
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🔍 Filters")
        
        filtered_df = df.copy()

        def get_unique_items(df, col_name):
            if col_name not in df.columns: return []
            items = df[col_name].astype(str).str.split(',').explode().str.strip()
            return sorted([x for x in items.unique() if x and x.lower() != 'nan'])

        def add_filter(label, col_key, split=False):
            actual_col = col_map.get(col_key)
            if col_key == "Cover" and actual_col not in df.columns:
                actual_col = col_map.get("Cover_Alt")
            
            if actual_col and actual_col in df.columns:
                if split:
                    opts = get_unique_items(df, actual_col)
                    sel = st.sidebar.multiselect(label, opts)
                    if sel:
                        pat = '|'.join(sel)
                        return sel, actual_col, pat
                else:
                    opts = sorted([str(x) for x in df[actual_col].unique() if str(x).strip() != ""])
                    sel = st.sidebar.multiselect(label, opts)
                    if sel: return sel, actual_col, None
            return None, None, None

        # Apply Filters
        sel, col, _ = add_filter("Author", "Author")
        if sel: filtered_df = filtered_df[filtered_df[col].isin(sel)]

        sel, col, _ = add_filter("Reading Status", "Status")
        if sel: filtered_df = filtered_df[filtered_df[col].isin(sel)]

        sel, col, _ = add_filter("Source", "Source")
        if sel: filtered_df = filtered_df[filtered_df[col].isin(sel)]

        sel, col, _ = add_filter("Owned?", "Owned")
        if sel: filtered_df = filtered_df[filtered_df[col].isin(sel)]

        sel, col, pat = add_filter("Primary Genre", "Primary", split=True)
        if sel: filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]

        sel, col, pat = add_filter("Secondary Genre(s)", "Secondary", split=True)
        if sel: filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]

        sel, col, pat = add_filter("Tropes", "Tropes", split=True)
        if sel: filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(pat, case=False, na=False)]
        
        # --- SEARCH ---
        c_title = col_map["Title"]
        all_titles = sorted(df[c_title].astype(str).unique().tolist())
        search_choice = st.selectbox("🔎 Search Book (Type to suggest):", [""] + all_titles, index=0)
        
        if search_choice:
            filtered_df = filtered_df[filtered_df[c_title] == search_choice]

        # --- SORTING ---
        sort_option = st.selectbox("Sort By:", [
            "Title (A to Z)", "Title (Z to A)",
            "Rating (Highest to Lowest)", "Rating (Lowest to Highest)",
            "Date Added (Newest to Oldest)", "Date Added (Oldest to Newest)"
        ])

        def parse_stars(val):
            s = str(val)
            return s.count('★') if '★' in s else (int(s) if s.isdigit() else 0)

        if "Title" in sort_option:
            asc = "A to Z" in sort_option
            filtered_df = filtered_df.sort_values(by=col_map["Title"], ascending=asc)
        elif "Rating" in sort_option:
            asc = "Lowest" in sort_option
            col_rate = col_map["Rating"]
            if col_rate and col_rate in df.columns:
                filtered_df['_tmp_rate'] = filtered_df[col_rate].apply(parse_stars)
                filtered_df = filtered_df.sort_values(by='_tmp_rate', ascending=asc)
        elif "Date Added" in sort_option:
            asc = "Oldest" in sort_option
            col_date = col_map["Timestamp"]
            if col_date and col_date in df.columns:
                filtered_df[col_date] = pd.to_datetime(filtered_df[col_date], errors='coerce')
                filtered_df = filtered_df.sort_values(by=col_date, ascending=asc)

        # --- MODAL ---
        @st.dialog("Book Details", width="large")
        def show_book_modal(book_row):
            st.markdown(f"<div class='book-header'>BOOK VIEW</div>", unsafe_allow_html=True)
            
            c1, c2 = st.columns([1, 1.5], gap="large")
            
            with c1:
                st.markdown(f"### {book_row.get(col_map['Title'], '')}")
                st.markdown(f"*{book_row.get(col_map['Author'], 'Unknown')}*")
                
                col_s1, col_s2 = st.columns([1, 3])
                s_num = col_s1.text_input("#", value=str(book_row.get(col_map['SeriesNum'], '')))
                s_name = col_s2.text_input("Series", value=str(book_row.get(col_map['Series'], '')))
                
                st.markdown("---")
                
                img_col = col_map["Cover"]
                if not img_col or img_col not in df.columns: img_col = col_map["Cover_Alt"]
                img_url = str(book_row.get(img_col, '')).strip()
                if len(img_url) > 5:
                    st.image(img_url, use_container_width=True)
                
                st.caption("Rating")
                raw_rating = book_row.get(col_map['Rating'], 0)
                if isinstance(raw_rating, str):
                    curr_stars = raw_rating.count('★') if '★' in raw_rating else (int(raw_rating) if raw_rating.isdigit() else 0)
                else:
                    curr_stars = int(raw_rating) if raw_rating else 0
                
                default_idx = curr_stars - 1 if curr_stars > 0 else None
                new_star_idx = st.feedback("stars", key="modal_stars")
                final_stars = new_star_idx + 1 if new_star_idx is not None else curr_stars

                st.caption("Status")
                opts = ["To Read", "Reading", "Read", "DNF"]
                curr = book_row.get(col_map['Status'], 'To Read')
                idx_stat = opts.index(curr) if curr in opts else 0
                new_stat = st.selectbox("Status", opts, index=idx_stat, label_visibility="collapsed")

            with c2:
                r1a, r1b = st.columns(2)
                new_date = r1a.text_input("DATE FINISHED", value=str(book_row.get(col_map['Date'], '')))
                new_owned = r1b.text_input("OWNED?", value=str(book_row.get(col_map['Owned'], '')))
                
                r2a, r2b = st.columns(2)
                new_fmt = r2a.text_input("FORMAT", value=str(book_row.get(col_map['Format'], '')))
                new_src = r2b.text_input("SOURCE", value=str(book_row.get(col_map['Source'], '')))
                
                new_p = st.text_area("PRIMARY GENRE", value=str(book_row.get(col_map['Primary'], '')), height=70)
                new_s = st.text_area("SECONDARY GENRE", value=str(book_row.get(col_map['Secondary'], '')), height=100)
                new_t = st.text_area("TROPES", value=str(book_row.get(col_map['Tropes'], '')), height=80)
                new_r = st.text_area("MY REVIEW", value=str(book_row.get(col_map['Review'], '')), height=150)

            st.markdown("---")
            col_del, col_space, col_save = st.columns([1, 2, 1])
            
            if col_del.button("🗑️ Delete", type="secondary"):
                st.warning("Click confirm to delete this book permanently.")
                st.session_state['confirm_delete'] = True

            if st.session_state.get('confirm_delete'):
                 if st.button("🚨 Confirm Delete", type="primary"):
                    try:
                        r = book_row['real_row_index']
                        target_ws.delete_rows(r)
                        st.toast("✅ Book Deleted!")
                        st.session_state['confirm_delete'] = False
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error: {e}")

            if col_save.button("💾 Save Changes", type="primary"):
                try:
                    r = book_row['real_row_index']
                    def get_idx(name): return df.columns.get_loc(name) + 1
                    
                    rating_str = "★" * final_stars if final_stars > 0 else ""
                    
                    if col_map['Series'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Series']), s_name)
                    if col_map['SeriesNum'] in df.columns: target_ws.update_cell(r, get_idx(col_map['SeriesNum']), s_num)
                    if col_map['Date'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Date']), new_date)
                    if col_map['Owned'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Owned']), new_owned)
                    if col_map['Format'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Format']), new_fmt)
                    if col_map['Source'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Source']), new_src)
                    if col_map['Primary'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Primary']), new_p)
                    if col_map['Secondary'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Secondary']), new_s)
                    if col_map['Tropes'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Tropes']), new_t)
                    if col_map['Review'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Review']), new_r)
                    if col_map['Status'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Status']), new_stat)
                    if col_map['Rating'] in df.columns: target_ws.update_cell(r, get_idx(col_map['Rating']), rating_str)
                    
                    st.toast("✅ Changes Saved!")
                    st.cache_data.clear()
                    st.rerun()
                except Exception as e:
                    st.error(f"Save failed: {e}")

        # --- GRID VIEW ---
        st.markdown(f"**Showing {len(filtered_df)} books**")
        cols = st.columns(5)
        
        for i, (index, row) in enumerate(filtered_df.iterrows()):
            col = cols[i % 5]
            with col:
                c_cover = col_map["Cover"]
                if not c_cover or c_cover not in df.columns: c_cover = col_map["Cover_Alt"]
                
                img_url = str(row.get(c_cover, '')).strip()
                if len(img_url) < 5 or not img_url.startswith('http'):
                    img_url = "https://via.placeholder.com/300x450?text=No+Cover"
                
                st.image(img_url, use_container_width=True)
                
                c_title = col_map["Title"]
                title_txt = str(row[c_title]) if c_title else "Untitled"
                
                if st.button(title_txt, key=f"btn_{index}"):
                    show_book_modal(row)

    except Exception as e:
        st.error(f"Something went wrong: {e}")
