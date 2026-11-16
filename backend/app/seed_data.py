# =====================================================================================
# FILE: seed_data.py  -  THE CONTENT: the 14 government schemes, written as Python data
# -------------------------------------------------------------------------------------
# This file holds no logic - only information, compiled from each scheme's official website.
# seed.py copies it into the database. To add or correct a scheme, edit this file only:
# the app notices the change (fingerprint in seed.py) and reloads the schemes on the next start.
# Two parts:
#   SCHEMES - list of 14 dictionaries, one per scheme (English text, rules, documents, how to apply)
#   EXTRA   - Hindi text and estimated benefit values for each scheme, keyed by slug
# =====================================================================================

"""Seed data for the prototype: 14 central government schemes.

Compiled from the official scheme portals listed in `official_source`.
Amounts and rules change; always confirm on the official source before applying.
Each criterion: (group_no, field, operator, value, plain-language label).
Criteria in the same group must all hold; any one group is enough.
"""

# Each scheme dictionary has:
#   slug                 - short unique code used inside the app
#   scheme_name, ministry, sector (category), description, target_beneficiaries, benefits, official_source
#   criteria  - eligibility rules as tuples: (group_no, profile field, operator, value, label shown to the user)
#               same group_no = ALL must hold (AND); different group_no = alternative ways to qualify (OR)
#               operators: eq, neq, gte (>=), lte (<=), between (range), in (one of a list)
#   documents - tuples: (document name, description, mandatory True/False)
#   application - mode (online/offline), numbered steps, apply_url, helpline
SCHEMES = [
    {
        # ---- Scheme 1 of 14: PM Kisan Samman Nidhi (PM-KISAN) ----
        "slug": "pm-kisan",
        "scheme_name": "PM Kisan Samman Nidhi (PM-KISAN)",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "sector": "Agriculture",
        "description": "Direct income support to landholding farmer families, paid straight into their bank accounts.",
        "target_beneficiaries": "Landholding farmer families with cultivable land in their name.",
        "benefits": "Rs 6,000 per year, paid in three instalments of Rs 2,000 through Direct Benefit Transfer.",
        "official_source": "https://pmkisan.gov.in",
        # Rules for this scheme (all in group 1, so all four must be true).
        "criteria": [
            (1, "occupation", "eq", "farmer", "You are a farmer"),
            (1, "owns_land", "eq", True, "Your family owns cultivable land"),
            (1, "income_tax_payer", "eq", False, "No one in the family paid income tax last year"),
            (1, "has_bank_account", "eq", True, "You have a bank account (Aadhaar-linked)"),
        ],
        # (document name, what it is, mandatory?)
        "documents": [
            ("Aadhaar card", "Mandatory for registration and eKYC", True),
            ("Land ownership records", "Khatauni / land record in the farmer's name", True),
            ("Bank account details", "Aadhaar-seeded savings account", True),
            ("Mobile number", "For OTP-based eKYC", True),
        ],
        # How to apply: mode, steps shown to the user, application link, helpline number.
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Visit pmkisan.gov.in and choose 'New Farmer Registration', or go to your nearest Common Service Centre (CSC).",
                "Enter Aadhaar number, mobile number and state.",
                "Fill in land details and bank account details.",
                "Complete eKYC using OTP or biometrics.",
                "Track status under 'Know Your Status' on the portal.",
            ],
            "apply_url": "https://pmkisan.gov.in",
            "helpline": "155261 / 011-24300606",
        },
    },
    {
        # ---- Scheme 2 of 14: Ayushman Bharat PM Jan Arogya Yojana (AB PM-JAY) ----
        "slug": "pm-jay",
        "scheme_name": "Ayushman Bharat PM Jan Arogya Yojana (AB PM-JAY)",
        "ministry": "Ministry of Health & Family Welfare",
        "sector": "Health",
        "description": "Cashless hospital treatment for poor and vulnerable families, and for all senior citizens aged 70 and above.",
        "target_beneficiaries": "Families identified as deprived in SECC 2011 data, and all citizens aged 70+ irrespective of income.",
        "benefits": "Health cover of up to Rs 5 lakh per family per year for secondary and tertiary hospitalisation at empanelled hospitals.",
        "official_source": "https://pmjay.gov.in",
        "criteria": [
            (1, "bpl", "eq", True, "Your family is listed as economically weaker (BPL / SECC)"),
            (2, "age", "gte", 70, "You are 70 years or older"),
        ],
        "documents": [
            ("Aadhaar card", "For identity verification and card generation", True),
            ("Ration card or PM letter", "Shows the family is in the beneficiary list", False),
            ("Mobile number", "For OTP verification", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Check your eligibility on beneficiary.nha.gov.in or the Ayushman app using your mobile number.",
                "If eligible, complete eKYC with Aadhaar.",
                "Download your Ayushman card, or get it made at a CSC or empanelled hospital.",
                "Show the card at any empanelled hospital for cashless treatment.",
            ],
            "apply_url": "https://beneficiary.nha.gov.in",
            "helpline": "14555",
        },
    },
    {
        # ---- Scheme 3 of 14: Pradhan Mantri Awas Yojana – Urban 2.0 ----
        "slug": "pmay-urban",
        "scheme_name": "Pradhan Mantri Awas Yojana – Urban 2.0",
        "ministry": "Ministry of Housing & Urban Affairs",
        "sector": "Housing",
        "description": "Central assistance for urban families without a pucca house to build, buy or rent a home.",
        "target_beneficiaries": "Urban EWS, LIG and MIG families (income up to Rs 9 lakh a year) who do not own a pucca house anywhere in India.",
        "benefits": "Financial assistance for construction or purchase, interest subsidy on home loans, and affordable rental housing options.",
        "official_source": "https://pmay-urban.gov.in",
        "criteria": [
            (1, "area", "eq", "urban", "You live in an urban area"),
            (1, "income", "lte", 900000, "Annual family income is Rs 9 lakh or less"),
            (1, "owns_pucca_house", "eq", False, "Your family does not own a pucca house anywhere in India"),
        ],
        "documents": [
            ("Aadhaar card", "Of all family members", True),
            ("Income certificate", "Or self-declaration for EWS/LIG", True),
            ("Bank account details", "For subsidy transfer", True),
            ("Land / property documents", "For construction or purchase", False),
        ],
        "application": {
            "mode": "Online",
            "steps": [
                "Go to pmay-urban.gov.in and select 'Apply for PMAY-U 2.0'.",
                "Check eligibility and verify Aadhaar.",
                "Fill in family, income and current housing details.",
                "Choose the component (construction, purchase, rental or interest subsidy).",
                "Submit and note the application number for tracking.",
            ],
            "apply_url": "https://pmay-urban.gov.in",
            "helpline": "1800-11-3377",
        },
    },
    {
        # ---- Scheme 4 of 14: Pradhan Mantri Ujjwala Yojana (PMUY) ----
        "slug": "ujjwala",
        "scheme_name": "Pradhan Mantri Ujjwala Yojana (PMUY)",
        "ministry": "Ministry of Petroleum & Natural Gas",
        "sector": "Social welfare",
        "description": "Deposit-free LPG connections for women from poor households.",
        "target_beneficiaries": "Adult women from poor households that do not already have an LPG connection.",
        "benefits": "Free LPG connection with first refill and stove, plus a targeted subsidy on refills.",
        "official_source": "https://pmuy.gov.in",
        "criteria": [
            (1, "gender", "eq", "female", "You are a woman"),
            (1, "age", "gte", 18, "You are 18 or older"),
            (1, "bpl", "eq", True, "Your household is economically weaker (BPL)"),
            (1, "has_lpg", "eq", False, "No one in the household has an LPG connection"),
        ],
        "documents": [
            ("Aadhaar card", "Of the applicant and adult family members", True),
            ("Ration card", "Issued by the state, showing family members", True),
            ("Bank account details", "For subsidy", True),
            ("Poverty status declaration", "14-point self declaration", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Apply on pmuy.gov.in or at the nearest LPG distributor.",
                "Choose an oil company (Indane, Bharatgas or HP Gas) and distributor.",
                "Submit KYC with Aadhaar, ration card and bank details.",
                "After verification, collect the connection from the distributor.",
            ],
            "apply_url": "https://pmuy.gov.in",
            "helpline": "1906",
        },
    },
    {
        # ---- Scheme 5 of 14: Sukanya Samriddhi Yojana (SSY) ----
        "slug": "sukanya-samriddhi",
        "scheme_name": "Sukanya Samriddhi Yojana (SSY)",
        "ministry": "Ministry of Finance",
        "sector": "Women & child",
        "description": "A small-savings account for a girl child that earns a government-set interest rate with tax benefits.",
        "target_beneficiaries": "Parents or legal guardians of a girl child below 10 years of age.",
        "benefits": "High, government-notified interest rate (revised quarterly); deposits qualify for tax deduction under Section 80C; maturity at 21 years.",
        "official_source": "https://www.indiapost.gov.in",
        "criteria": [
            (1, "has_girl_child_under_10", "eq", True, "You have a daughter younger than 10"),
        ],
        "documents": [
            ("Birth certificate of the girl child", "Proof of age", True),
            ("Aadhaar / ID of parent or guardian", "KYC of depositor", True),
            ("Address proof", "Of parent or guardian", True),
        ],
        "application": {
            "mode": "Offline",
            "steps": [
                "Visit a post office or authorised bank branch.",
                "Fill in the SSY account opening form.",
                "Submit the girl's birth certificate and your KYC documents.",
                "Make the first deposit (minimum Rs 250).",
            ],
            "apply_url": "https://www.indiapost.gov.in",
            "helpline": "1800-266-6868",
        },
    },
    {
        # ---- Scheme 6 of 14: Atal Pension Yojana (APY) ----
        "slug": "atal-pension",
        "scheme_name": "Atal Pension Yojana (APY)",
        "ministry": "Ministry of Finance",
        "sector": "Pension",
        "description": "A guaranteed pension scheme for workers, mainly in the unorganised sector.",
        "target_beneficiaries": "Citizens aged 18 to 40 with a savings bank account who are not income tax payers.",
        "benefits": "Guaranteed monthly pension of Rs 1,000 to Rs 5,000 from age 60, depending on contribution; pension continues to spouse.",
        "official_source": "https://www.myscheme.gov.in/schemes/apy",
        "criteria": [
            (1, "age", "between", [18, 40], "You are between 18 and 40"),
            (1, "has_bank_account", "eq", True, "You have a savings bank account"),
            (1, "income_tax_payer", "eq", False, "You are not an income tax payer"),
        ],
        "documents": [
            ("Savings bank account", "Auto-debit of contribution", True),
            ("Aadhaar card", "Identity and KYC", True),
            ("Mobile number", "For updates", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Easiest: log in to your bank's net banking or mobile app and look for 'Atal Pension Yojana' (often under social security schemes).",
                "Or visit the bank or post office branch where you have a savings account and fill in the APY registration form.",
                "Choose a monthly pension amount (Rs 1,000 to Rs 5,000) and add nominee details.",
                "Give consent for monthly auto-debit of your contribution.",
                "You receive a PRAN (Permanent Retirement Account Number) once registered.",
            ],
            "apply_url": "https://www.npscra.nsdl.co.in",
            "helpline": "1800-110-069",
        },
    },
    {
        # ---- Scheme 7 of 14: Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) ----
        "slug": "pmjjby",
        "scheme_name": "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
        "ministry": "Ministry of Finance",
        "sector": "Insurance",
        "description": "Low-cost one-year renewable life insurance cover.",
        "target_beneficiaries": "Bank account holders aged 18 to 50.",
        "benefits": "Life cover of Rs 2 lakh for death due to any cause, for a premium of Rs 436 per year.",
        "official_source": "https://jansuraksha.gov.in",
        "criteria": [
            (1, "age", "between", [18, 50], "You are between 18 and 50"),
            (1, "has_bank_account", "eq", True, "You have a bank or post office account"),
        ],
        "documents": [
            ("Bank account", "Premium auto-debit", True),
            ("Aadhaar card", "KYC", True),
            ("Nominee details", "Name and relationship", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Fill in the PMJJBY form at your bank branch, or enrol through net banking.",
                "Add nominee details.",
                "Give consent for annual auto-debit of the premium.",
            ],
            "apply_url": "https://jansuraksha.gov.in",
            "helpline": "1800-180-1111",
        },
    },
    {
        # ---- Scheme 8 of 14: Pradhan Mantri Suraksha Bima Yojana (PMSBY) ----
        "slug": "pmsby",
        "scheme_name": "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
        "ministry": "Ministry of Finance",
        "sector": "Insurance",
        "description": "Low-cost accident insurance cover renewed every year.",
        "target_beneficiaries": "Bank account holders aged 18 to 70.",
        "benefits": "Rs 2 lakh for accidental death or full disability, Rs 1 lakh for partial disability, for a premium of Rs 20 per year.",
        "official_source": "https://jansuraksha.gov.in",
        "criteria": [
            (1, "age", "between", [18, 70], "You are between 18 and 70"),
            (1, "has_bank_account", "eq", True, "You have a bank or post office account"),
        ],
        "documents": [
            ("Bank account", "Premium auto-debit", True),
            ("Aadhaar card", "KYC", True),
            ("Nominee details", "Name and relationship", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Enrol at your bank branch or through net banking.",
                "Add nominee details.",
                "Give consent for annual auto-debit of Rs 20.",
            ],
            "apply_url": "https://jansuraksha.gov.in",
            "helpline": "1800-180-1111",
        },
    },
    {
        # ---- Scheme 9 of 14: Post Matric Scholarship for SC Students ----
        "slug": "post-matric-sc",
        "scheme_name": "Post Matric Scholarship for SC Students",
        "ministry": "Ministry of Social Justice & Empowerment",
        "sector": "Education",
        "description": "Scholarship covering fees and maintenance for Scheduled Caste students studying beyond Class 10.",
        "target_beneficiaries": "SC students in Class 11 and above (including graduation and post-graduation) with family income up to Rs 2.5 lakh a year.",
        "benefits": "Compulsory non-refundable fees reimbursed, plus an annual academic allowance.",
        "official_source": "https://scholarships.gov.in",
        "criteria": [
            (1, "category", "eq", "SC", "You belong to a Scheduled Caste"),
            (1, "occupation", "eq", "student", "You are currently a student"),
            (1, "education", "in", ["post_matric", "graduate", "postgraduate"], "You are studying in Class 11 or above"),
            (1, "income", "lte", 250000, "Annual family income is Rs 2.5 lakh or less"),
        ],
        "documents": [
            ("Caste certificate", "Issued by competent authority", True),
            ("Income certificate", "Family income for the previous year", True),
            ("Previous marksheet", "Last qualifying exam", True),
            ("Fee receipt", "Current academic year", True),
            ("Aadhaar-linked bank account", "For DBT", True),
        ],
        "application": {
            "mode": "Online",
            "steps": [
                "Register on the National Scholarship Portal (scholarships.gov.in) with One Time Registration.",
                "Log in and select the Post Matric Scholarship for SC students (or your state's portal if applicable).",
                "Upload documents and submit.",
                "Get the application verified by your institute.",
            ],
            "apply_url": "https://scholarships.gov.in",
            "helpline": "0120-6619540",
        },
    },
    {
        # ---- Scheme 10 of 14: PM Vishwakarma ----
        "slug": "pm-vishwakarma",
        "scheme_name": "PM Vishwakarma",
        "ministry": "Ministry of Micro, Small & Medium Enterprises",
        "sector": "Employment & skills",
        "description": "End-to-end support for traditional artisans and craftspeople working with their hands and tools.",
        "target_beneficiaries": "Artisans in 18 listed trades (carpenter, blacksmith, potter, tailor, cobbler and others), aged 18+, self-employed in the trade.",
        "benefits": "Recognition certificate and ID card, skill training with Rs 500/day stipend, Rs 15,000 toolkit incentive, and collateral-free loans up to Rs 3 lakh at concessional interest.",
        "official_source": "https://pmvishwakarma.gov.in",
        "criteria": [
            (1, "occupation", "eq", "artisan", "You work in a traditional craft or trade"),
            (1, "age", "gte", 18, "You are 18 or older"),
            (1, "income_tax_payer", "eq", False, "You are not an income tax payer"),
        ],
        "documents": [
            ("Aadhaar card", "Biometric authentication", True),
            ("Mobile number", "Linked to Aadhaar", True),
            ("Bank account details", "For stipend and incentives", True),
            ("Ration card", "Family identification", False),
        ],
        "application": {
            "mode": "Offline (via CSC)",
            "steps": [
                "Visit a Common Service Centre with your Aadhaar and mobile.",
                "Register with biometric authentication on pmvishwakarma.gov.in.",
                "Fill in trade and personal details.",
                "Verification happens at Gram Panchayat / ULB, district and state level.",
            ],
            "apply_url": "https://pmvishwakarma.gov.in",
            "helpline": "18002677777",
        },
    },
    {
        # ---- Scheme 11 of 14: Pradhan Mantri Mudra Yojana (PMMY) ----
        "slug": "mudra",
        "scheme_name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "ministry": "Ministry of Finance",
        "sector": "Business & credit",
        "description": "Collateral-free loans for non-farm micro and small businesses.",
        "target_beneficiaries": "Individuals running or starting small manufacturing, trading or service businesses.",
        "benefits": "Loans in four categories: Shishu (up to Rs 50,000), Kishore (up to Rs 5 lakh), Tarun (up to Rs 10 lakh) and Tarun Plus (up to Rs 20 lakh).",
        "official_source": "https://www.mudra.org.in",
        "criteria": [
            (1, "occupation", "in", ["self_employed", "artisan", "street_vendor"], "You run or want to start a small business"),
            (1, "age", "gte", 18, "You are 18 or older"),
        ],
        "documents": [
            ("Identity and address proof", "Aadhaar, voter ID or similar", True),
            ("Business plan or proof of business", "Quotation, registration or similar", True),
            ("Bank statements", "Last 6 months, if available", False),
            ("Passport-size photographs", "", True),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Approach any bank, NBFC or MFI, or apply on the JanSamarth portal.",
                "Choose the loan category based on your requirement.",
                "Submit the application with KYC and business documents.",
                "The lender appraises and sanctions the loan.",
            ],
            "apply_url": "https://www.jansamarth.in",
            "helpline": "1800-180-1111",
        },
    },
    {
        # ---- Scheme 12 of 14: Stand-Up India ----
        "slug": "stand-up-india",
        "scheme_name": "Stand-Up India",
        "ministry": "Ministry of Finance",
        "sector": "Business & credit",
        "description": "Bank loans for SC/ST and women entrepreneurs to set up a new (greenfield) enterprise.",
        "target_beneficiaries": "SC/ST and/or women entrepreneurs aged 18+ starting a new business in manufacturing, services, trading or allied agriculture.",
        "benefits": "Bank loans between Rs 10 lakh and Rs 1 crore, with handholding support.",
        "official_source": "https://www.standupmitra.in",
        "criteria": [
            (1, "gender", "eq", "female", "You are a woman entrepreneur"),
            (1, "age", "gte", 18, "You are 18 or older"),
            (1, "occupation", "in", ["self_employed", "unemployed", "homemaker"], "You want to start a new business"),
            (2, "category", "in", ["SC", "ST"], "You belong to SC or ST"),
            (2, "age", "gte", 18, "You are 18 or older"),
            (2, "occupation", "in", ["self_employed", "unemployed"], "You want to start a new business"),
        ],
        "documents": [
            ("Identity and address proof", "", True),
            ("Caste certificate", "For SC/ST applicants", False),
            ("Project report", "Details of the new enterprise", True),
            ("Business address proof", "", True),
        ],
        "application": {
            "mode": "Online",
            "steps": [
                "Register on standupmitra.in.",
                "Answer the questions about your business plan and background.",
                "Apply to a bank branch through the portal or directly.",
            ],
            "apply_url": "https://www.standupmitra.in",
            "helpline": "1800-180-1111",
        },
    },
    {
        # ---- Scheme 13 of 14: Pradhan Mantri Matru Vandana Yojana (PMMVY) ----
        "slug": "pmmvy",
        "scheme_name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "ministry": "Ministry of Women & Child Development",
        "sector": "Women & child",
        "description": "Maternity benefit to support pregnant women and new mothers.",
        "target_beneficiaries": "Pregnant women and lactating mothers aged 19+, for the first child (and the second child if it is a girl).",
        "benefits": "Rs 5,000 for the first child in instalments, and Rs 6,000 for a second child if it is a girl, through DBT.",
        "official_source": "https://pmmvy.wcd.gov.in",
        "criteria": [
            (1, "gender", "eq", "female", "You are a woman"),
            (1, "age", "gte", 19, "You are 19 or older"),
            (1, "pregnant_or_lactating", "eq", True, "You are pregnant or a new mother"),
            (1, "has_bank_account", "eq", True, "You have a bank or post office account"),
        ],
        "documents": [
            ("Aadhaar card", "Of the beneficiary", True),
            ("MCP card", "Mother and Child Protection card", True),
            ("Bank or post office account", "Aadhaar-seeded", True),
            ("Birth registration", "For the child, at the final instalment", False),
        ],
        "application": {
            "mode": "Online & Offline",
            "steps": [
                "Register at your Anganwadi centre or health facility, or on pmmvy.wcd.gov.in.",
                "Submit the application form with Aadhaar and MCP card.",
                "Instalments are paid after the required health check-ups.",
            ],
            "apply_url": "https://pmmvy.wcd.gov.in",
            "helpline": "14408",
        },
    },
    {
        # ---- Scheme 14 of 14: Indira Gandhi National Old Age Pension Scheme (IGNOAPS) ----
        "slug": "ignoaps",
        "scheme_name": "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
        "ministry": "Ministry of Rural Development",
        "sector": "Pension",
        "description": "Monthly pension for elderly people from below-poverty-line households, under the National Social Assistance Programme.",
        "target_beneficiaries": "Persons aged 60 and above belonging to BPL households.",
        "benefits": "Central assistance of Rs 200 per month (age 60–79) and Rs 500 per month (80+); many states add a top-up.",
        "official_source": "https://nsap.nic.in",
        "criteria": [
            (1, "age", "gte", 60, "You are 60 or older"),
            (1, "bpl", "eq", True, "Your household is below the poverty line"),
        ],
        "documents": [
            ("Age proof", "Birth certificate, Aadhaar or similar", True),
            ("BPL card", "Proof of BPL status", True),
            ("Bank or post office account", "For pension credit", True),
        ],
        "application": {
            "mode": "Offline",
            "steps": [
                "Apply at the Gram Panchayat (rural) or municipal office (urban), or through your state's social welfare portal.",
                "Submit the form with age proof and BPL card.",
                "After verification, pension is credited monthly.",
            ],
            "apply_url": "https://nsap.nic.in",
            "helpline": None,
        },
    },
]


# Hindi text and estimated benefit value per scheme.
# value entries: (type, amount_in_inr, short English label)
#   annual_cash = money received every year, one_time = one-time support,
#   cover = insurance / health cover, loan = maximum credit available,
#   pension / in_kind / savings / scholarship = non-additive benefits (shown as text only)
# EXTRA[slug] = Hindi name, Hindi summary, Hindi benefits, and `values`:
# estimated benefit amounts as (type, amount in rupees, label). Types:
#   annual_cash = money every year, one_time = paid once, cover = insurance/health cover,
#   loan = maximum loan amount; in_kind, savings, pension, scholarship = listed by name, not added up.
# These are added up on the results page ("Cash support per year", "Insurance and health cover").
EXTRA = {
    "pm-kisan": dict(name_hi="प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
                     summary_hi="ज़मीन वाले किसान परिवारों को सीधे बैंक खाते में आय सहायता।",
                     benefits_hi="हर साल ₹6,000, ₹2,000 की तीन किस्तों में सीधे बैंक खाते में।",
                     values=[("annual_cash", 6000, "₹6,000 a year")]),
    "pm-jay": dict(name_hi="आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना",
                   summary_hi="गरीब परिवारों और 70 वर्ष से अधिक उम्र के सभी नागरिकों के लिए कैशलेस अस्पताल इलाज।",
                   benefits_hi="हर परिवार को हर साल ₹5 लाख तक का मुफ़्त इलाज, सूचीबद्ध अस्पतालों में।",
                   values=[("cover", 500000, "₹5 lakh health cover a year")]),
    "pmay-urban": dict(name_hi="प्रधानमंत्री आवास योजना – शहरी 2.0",
                       summary_hi="शहरों में पक्का घर न रखने वाले परिवारों को घर बनाने, खरीदने या किराये पर लेने में सहायता।",
                       benefits_hi="घर बनाने या खरीदने के लिए आर्थिक सहायता, होम लोन पर ब्याज सब्सिडी और किफ़ायती किराये के घर।",
                       values=[("one_time", 250000, "Up to ₹2.5 lakh housing assistance")]),
    "ujjwala": dict(name_hi="प्रधानमंत्री उज्ज्वला योजना",
                    summary_hi="गरीब परिवारों की महिलाओं को बिना जमानत राशि के एलपीजी कनेक्शन।",
                    benefits_hi="मुफ़्त एलपीजी कनेक्शन, पहली रीफ़िल और चूल्हा, साथ में रीफ़िल पर सब्सिडी।",
                    values=[("in_kind", 0, "Free LPG connection")]),
    "sukanya-samriddhi": dict(name_hi="सुकन्या समृद्धि योजना",
                              summary_hi="बेटी के लिए बचत खाता, जिस पर सरकार द्वारा तय ब्याज और टैक्स छूट मिलती है।",
                              benefits_hi="ऊँची सरकारी ब्याज दर (हर तिमाही तय), धारा 80C में टैक्स छूट, 21 वर्ष पर परिपक्वता।",
                              values=[("savings", 0, "Tax-free savings for your daughter")]),
    "atal-pension": dict(name_hi="अटल पेंशन योजना",
                         summary_hi="असंगठित क्षेत्र के कामगारों के लिए गारंटीड पेंशन योजना।",
                         benefits_hi="60 वर्ष के बाद हर महीने ₹1,000 से ₹5,000 तक की गारंटीड पेंशन।",
                         values=[("pension", 5000, "Pension up to ₹5,000 a month from 60")]),
    "pmjjby": dict(name_hi="प्रधानमंत्री जीवन ज्योति बीमा योजना",
                   summary_hi="कम प्रीमियम वाला एक साल का जीवन बीमा।",
                   benefits_hi="₹436 सालाना प्रीमियम पर ₹2 लाख का जीवन बीमा।",
                   values=[("cover", 200000, "₹2 lakh life cover")]),
    "pmsby": dict(name_hi="प्रधानमंत्री सुरक्षा बीमा योजना",
                  summary_hi="कम प्रीमियम वाला दुर्घटना बीमा।",
                  benefits_hi="₹20 सालाना प्रीमियम पर दुर्घटना में मृत्यु या पूर्ण विकलांगता पर ₹2 लाख।",
                  values=[("cover", 200000, "₹2 lakh accident cover")]),
    "post-matric-sc": dict(name_hi="अनुसूचित जाति के छात्रों के लिए पोस्ट मैट्रिक छात्रवृत्ति",
                           summary_hi="कक्षा 10 के बाद पढ़ रहे अनुसूचित जाति के छात्रों के लिए फ़ीस और भत्ते की छात्रवृत्ति।",
                           benefits_hi="अनिवार्य फ़ीस की भरपाई और सालाना शैक्षणिक भत्ता।",
                           values=[("scholarship", 0, "Fees reimbursed + yearly allowance")]),
    "pm-vishwakarma": dict(name_hi="पीएम विश्वकर्मा",
                           summary_hi="पारंपरिक कारीगरों और शिल्पकारों के लिए संपूर्ण सहायता।",
                           benefits_hi="प्रमाणपत्र और पहचान पत्र, ₹500 प्रतिदिन वज़ीफ़े के साथ प्रशिक्षण, ₹15,000 टूलकिट सहायता और ₹3 लाख तक बिना गारंटी का सस्ता लोन।",
                           values=[("one_time", 15000, "₹15,000 toolkit support"), ("loan", 300000, "Loans up to ₹3 lakh")]),
    "mudra": dict(name_hi="प्रधानमंत्री मुद्रा योजना",
                  summary_hi="छोटे गैर-कृषि व्यवसायों के लिए बिना गारंटी का लोन।",
                  benefits_hi="शिशु (₹50,000 तक), किशोर (₹5 लाख तक), तरुण (₹10 लाख तक) और तरुण प्लस (₹20 लाख तक) लोन।",
                  values=[("loan", 2000000, "Business loans up to ₹20 lakh")]),
    "stand-up-india": dict(name_hi="स्टैंड-अप इंडिया",
                           summary_hi="नया व्यवसाय शुरू करने वाले अनुसूचित जाति/जनजाति और महिला उद्यमियों के लिए बैंक लोन।",
                           benefits_hi="₹10 लाख से ₹1 करोड़ तक का बैंक लोन और मार्गदर्शन।",
                           values=[("loan", 10000000, "Loans from ₹10 lakh to ₹1 crore")]),
    "pmmvy": dict(name_hi="प्रधानमंत्री मातृ वंदना योजना",
                  summary_hi="गर्भवती महिलाओं और नई माताओं के लिए मातृत्व लाभ।",
                  benefits_hi="पहले बच्चे पर ₹5,000 और दूसरी संतान बेटी होने पर ₹6,000, सीधे बैंक खाते में।",
                  values=[("one_time", 5000, "₹5,000 maternity benefit")]),
    "ignoaps": dict(name_hi="इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
                    summary_hi="गरीबी रेखा से नीचे के बुज़ुर्गों के लिए मासिक पेंशन।",
                    benefits_hi="60–79 वर्ष पर ₹200 और 80+ पर ₹500 प्रति माह केंद्रीय सहायता; कई राज्य अतिरिक्त राशि देते हैं।",
                    values=[("annual_cash", 2400, "₹200–500 a month pension")]),
}
