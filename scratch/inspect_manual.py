import sys
try:
    from pdfminer.high_level import extract_text
    text = extract_text('assets/APEX_PRO_X1_Ultra_User_Manual.pdf')
    print("--- EXTRACTED TEXT (FIRST 2000 CHARS) ---")
    print(text[:2000])
    print("\n--- SEARCHING FOR 'SECURITY' ---")
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if 'security' in line.lower() or 'lock' in line.lower():
            print(f"Line {i}: {line.strip()}")
except Exception as e:
    print(f"Error: {e}")
