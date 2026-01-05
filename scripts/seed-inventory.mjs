// Inventory seed script - run this to populate the inventory with sample data
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample Categories
const categories = [
  {
    name: "Pain Relief",
    description: "Analgesics and pain management medications",
    type: "medication",
  },
  {
    name: "Antibiotics",
    description: "Anti-bacterial medications",
    type: "medication",
  },
  {
    name: "Cardiovascular",
    description: "Heart and blood pressure medications",
    type: "medication",
  },
  {
    name: "Gastrointestinal",
    description: "Digestive system medications",
    type: "medication",
  },
  {
    name: "Respiratory",
    description: "Breathing and respiratory medications",
    type: "medication",
  },
  {
    name: "Diabetes Care",
    description: "Diabetes management medications",
    type: "medication",
  },
  {
    name: "Vitamins & Supplements",
    description: "Nutritional supplements and vitamins",
    type: "medication",
  },
  {
    name: "Dermatological",
    description: "Skin care medications and creams",
    type: "medication",
  },
  {
    name: "Medical Supplies",
    description: "Bandages, syringes, and medical consumables",
    type: "supply",
  },
  {
    name: "Personal Protective Equipment",
    description: "Gloves, masks, and protective gear",
    type: "supply",
  },
  {
    name: "Diagnostic Equipment",
    description: "Blood pressure monitors, thermometers, etc.",
    type: "equipment",
  },
  {
    name: "First Aid",
    description: "First aid supplies and kits",
    type: "supply",
  },
];

// Sample Suppliers
const suppliers = [
  {
    name: "MedPharm Distributors",
    contact_person: "Rajesh Kumar",
    email: "orders@medpharm.in",
    phone: "+91 98765 43210",
    address: "123 Pharma Street, Industrial Area",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    postal_code: "600001",
    payment_terms: "Net 30",
  },
  {
    name: "HealthCare Supplies Pvt Ltd",
    contact_person: "Priya Sharma",
    email: "sales@healthcaresupplies.in",
    phone: "+91 87654 32109",
    address: "456 Medical Complex, Sector 12",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postal_code: "400001",
    payment_terms: "Net 45",
  },
  {
    name: "Wellness Pharma",
    contact_person: "Arun Patel",
    email: "contact@wellnesspharma.com",
    phone: "+91 76543 21098",
    address: "789 Health Hub, Phase 2",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    postal_code: "560001",
    payment_terms: "Net 30",
  },
  {
    name: "Global Medical Equipment",
    contact_person: "Sunita Reddy",
    email: "info@globalmedequip.in",
    phone: "+91 65432 10987",
    address: "321 Tech Park, Industrial Zone",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    postal_code: "500001",
    payment_terms: "Net 60",
  },
];

// Sample Inventory Items (will be linked to categories and suppliers)
const inventoryItems = [
  // Pain Relief
  {
    sku: "MED-PR-001",
    barcode: "8901234567001",
    name: "Paracetamol 500mg",
    generic_name: "Acetaminophen",
    description: "Pain reliever and fever reducer",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "500mg",
    manufacturer: "Cipla Ltd",
    current_stock: 500,
    minimum_stock: 100,
    maximum_stock: 1000,
    reorder_level: 150,
    unit_of_measure: "strips",
    cost_price: 15.0,
    selling_price: 25.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, below 25°C",
    categoryName: "Pain Relief",
  },
  {
    sku: "MED-PR-002",
    barcode: "8901234567002",
    name: "Ibuprofen 400mg",
    generic_name: "Ibuprofen",
    description: "Non-steroidal anti-inflammatory drug",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "400mg",
    manufacturer: "Sun Pharma",
    current_stock: 350,
    minimum_stock: 80,
    maximum_stock: 800,
    reorder_level: 120,
    unit_of_measure: "strips",
    cost_price: 25.0,
    selling_price: 40.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Pain Relief",
  },
  {
    sku: "MED-PR-003",
    barcode: "8901234567003",
    name: "Diclofenac 50mg",
    generic_name: "Diclofenac Sodium",
    description: "NSAID for pain and inflammation",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "50mg",
    manufacturer: "Dr. Reddy's",
    current_stock: 200,
    minimum_stock: 50,
    maximum_stock: 500,
    reorder_level: 75,
    unit_of_measure: "strips",
    cost_price: 20.0,
    selling_price: 35.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Pain Relief",
  },
  // Antibiotics
  {
    sku: "MED-AB-001",
    barcode: "8901234567010",
    name: "Amoxicillin 500mg",
    generic_name: "Amoxicillin",
    description: "Broad-spectrum antibiotic",
    item_type: "medication",
    dosage_form: "capsule",
    strength: "500mg",
    manufacturer: "Cipla Ltd",
    current_stock: 300,
    minimum_stock: 100,
    maximum_stock: 600,
    reorder_level: 150,
    unit_of_measure: "strips",
    cost_price: 45.0,
    selling_price: 75.0,
    requires_prescription: true,
    storage_conditions: "Room temperature, keep dry",
    categoryName: "Antibiotics",
  },
  {
    sku: "MED-AB-002",
    barcode: "8901234567011",
    name: "Azithromycin 250mg",
    generic_name: "Azithromycin",
    description: "Macrolide antibiotic",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "250mg",
    manufacturer: "Zydus Healthcare",
    current_stock: 250,
    minimum_stock: 60,
    maximum_stock: 500,
    reorder_level: 100,
    unit_of_measure: "strips",
    cost_price: 80.0,
    selling_price: 120.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Antibiotics",
  },
  {
    sku: "MED-AB-003",
    barcode: "8901234567012",
    name: "Ciprofloxacin 500mg",
    generic_name: "Ciprofloxacin",
    description: "Fluoroquinolone antibiotic",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "500mg",
    manufacturer: "Ranbaxy",
    current_stock: 180,
    minimum_stock: 50,
    maximum_stock: 400,
    reorder_level: 80,
    unit_of_measure: "strips",
    cost_price: 55.0,
    selling_price: 90.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Antibiotics",
  },
  // Cardiovascular
  {
    sku: "MED-CV-001",
    barcode: "8901234567020",
    name: "Atenolol 50mg",
    generic_name: "Atenolol",
    description: "Beta blocker for hypertension",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "50mg",
    manufacturer: "Torrent Pharma",
    current_stock: 400,
    minimum_stock: 100,
    maximum_stock: 800,
    reorder_level: 150,
    unit_of_measure: "strips",
    cost_price: 30.0,
    selling_price: 50.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Cardiovascular",
  },
  {
    sku: "MED-CV-002",
    barcode: "8901234567021",
    name: "Amlodipine 5mg",
    generic_name: "Amlodipine Besylate",
    description: "Calcium channel blocker",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "5mg",
    manufacturer: "Lupin Ltd",
    current_stock: 450,
    minimum_stock: 120,
    maximum_stock: 900,
    reorder_level: 180,
    unit_of_measure: "strips",
    cost_price: 35.0,
    selling_price: 55.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Cardiovascular",
  },
  {
    sku: "MED-CV-003",
    barcode: "8901234567022",
    name: "Aspirin 75mg",
    generic_name: "Acetylsalicylic Acid",
    description: "Blood thinner for heart health",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "75mg",
    manufacturer: "USV Pvt Ltd",
    current_stock: 600,
    minimum_stock: 150,
    maximum_stock: 1200,
    reorder_level: 200,
    unit_of_measure: "strips",
    cost_price: 12.0,
    selling_price: 20.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, protect from moisture",
    categoryName: "Cardiovascular",
  },
  // Gastrointestinal
  {
    sku: "MED-GI-001",
    barcode: "8901234567030",
    name: "Omeprazole 20mg",
    generic_name: "Omeprazole",
    description: "Proton pump inhibitor for acidity",
    item_type: "medication",
    dosage_form: "capsule",
    strength: "20mg",
    manufacturer: "Mankind Pharma",
    current_stock: 380,
    minimum_stock: 100,
    maximum_stock: 700,
    reorder_level: 150,
    unit_of_measure: "strips",
    cost_price: 40.0,
    selling_price: 65.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Gastrointestinal",
  },
  {
    sku: "MED-GI-002",
    barcode: "8901234567031",
    name: "Domperidone 10mg",
    generic_name: "Domperidone",
    description: "Anti-emetic for nausea and vomiting",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "10mg",
    manufacturer: "Abbott India",
    current_stock: 280,
    minimum_stock: 70,
    maximum_stock: 500,
    reorder_level: 100,
    unit_of_measure: "strips",
    cost_price: 25.0,
    selling_price: 42.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Gastrointestinal",
  },
  // Respiratory
  {
    sku: "MED-RS-001",
    barcode: "8901234567040",
    name: "Salbutamol Inhaler",
    generic_name: "Salbutamol",
    description: "Bronchodilator for asthma",
    item_type: "medication",
    dosage_form: "inhaler",
    strength: "100mcg",
    manufacturer: "Cipla Ltd",
    current_stock: 120,
    minimum_stock: 30,
    maximum_stock: 250,
    reorder_level: 50,
    unit_of_measure: "units",
    cost_price: 150.0,
    selling_price: 220.0,
    requires_prescription: true,
    storage_conditions: "Room temperature, protect from sunlight",
    categoryName: "Respiratory",
  },
  {
    sku: "MED-RS-002",
    barcode: "8901234567041",
    name: "Cetirizine 10mg",
    generic_name: "Cetirizine Hydrochloride",
    description: "Antihistamine for allergies",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "10mg",
    manufacturer: "Dr. Reddy's",
    current_stock: 500,
    minimum_stock: 100,
    maximum_stock: 1000,
    reorder_level: 150,
    unit_of_measure: "strips",
    cost_price: 18.0,
    selling_price: 30.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Respiratory",
  },
  {
    sku: "MED-RS-003",
    barcode: "8901234567042",
    name: "Montelukast 10mg",
    generic_name: "Montelukast Sodium",
    description: "Leukotriene inhibitor for asthma",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "10mg",
    manufacturer: "Sun Pharma",
    current_stock: 220,
    minimum_stock: 50,
    maximum_stock: 400,
    reorder_level: 80,
    unit_of_measure: "strips",
    cost_price: 60.0,
    selling_price: 95.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Respiratory",
  },
  // Diabetes Care
  {
    sku: "MED-DB-001",
    barcode: "8901234567050",
    name: "Metformin 500mg",
    generic_name: "Metformin Hydrochloride",
    description: "Oral antidiabetic medication",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "500mg",
    manufacturer: "USV Pvt Ltd",
    current_stock: 550,
    minimum_stock: 150,
    maximum_stock: 1100,
    reorder_level: 200,
    unit_of_measure: "strips",
    cost_price: 22.0,
    selling_price: 38.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Diabetes Care",
  },
  {
    sku: "MED-DB-002",
    barcode: "8901234567051",
    name: "Glimepiride 2mg",
    generic_name: "Glimepiride",
    description: "Sulfonylurea for diabetes",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "2mg",
    manufacturer: "Glenmark Pharma",
    current_stock: 320,
    minimum_stock: 80,
    maximum_stock: 600,
    reorder_level: 120,
    unit_of_measure: "strips",
    cost_price: 35.0,
    selling_price: 55.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Diabetes Care",
  },
  // Vitamins & Supplements
  {
    sku: "MED-VS-001",
    barcode: "8901234567060",
    name: "Vitamin D3 60000 IU",
    generic_name: "Cholecalciferol",
    description: "Weekly vitamin D supplement",
    item_type: "medication",
    dosage_form: "capsule",
    strength: "60000 IU",
    manufacturer: "Cipla Ltd",
    current_stock: 400,
    minimum_stock: 100,
    maximum_stock: 800,
    reorder_level: 150,
    unit_of_measure: "sachets",
    cost_price: 30.0,
    selling_price: 50.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, protect from light",
    categoryName: "Vitamins & Supplements",
  },
  {
    sku: "MED-VS-002",
    barcode: "8901234567061",
    name: "Multivitamin Tablets",
    generic_name: "Multivitamin Complex",
    description: "Daily multivitamin supplement",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "Multiple",
    manufacturer: "Abbott India",
    current_stock: 350,
    minimum_stock: 80,
    maximum_stock: 600,
    reorder_level: 120,
    unit_of_measure: "bottles",
    cost_price: 120.0,
    selling_price: 180.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Vitamins & Supplements",
  },
  {
    sku: "MED-VS-003",
    barcode: "8901234567062",
    name: "Calcium + Vitamin D3",
    generic_name: "Calcium Carbonate with Vitamin D3",
    description: "Bone health supplement",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "500mg + 250IU",
    manufacturer: "GSK Healthcare",
    current_stock: 280,
    minimum_stock: 70,
    maximum_stock: 500,
    reorder_level: 100,
    unit_of_measure: "bottles",
    cost_price: 90.0,
    selling_price: 140.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Vitamins & Supplements",
  },
  // Dermatological
  {
    sku: "MED-DM-001",
    barcode: "8901234567070",
    name: "Clotrimazole Cream 1%",
    generic_name: "Clotrimazole",
    description: "Antifungal cream for skin infections",
    item_type: "medication",
    dosage_form: "cream",
    strength: "1%",
    manufacturer: "Glenmark Pharma",
    current_stock: 180,
    minimum_stock: 40,
    maximum_stock: 350,
    reorder_level: 60,
    unit_of_measure: "tubes",
    cost_price: 45.0,
    selling_price: 75.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Dermatological",
  },
  {
    sku: "MED-DM-002",
    barcode: "8901234567071",
    name: "Betamethasone Cream",
    generic_name: "Betamethasone Dipropionate",
    description: "Topical corticosteroid",
    item_type: "medication",
    dosage_form: "cream",
    strength: "0.05%",
    manufacturer: "Cadila Healthcare",
    current_stock: 150,
    minimum_stock: 35,
    maximum_stock: 300,
    reorder_level: 50,
    unit_of_measure: "tubes",
    cost_price: 55.0,
    selling_price: 85.0,
    requires_prescription: true,
    storage_conditions: "Room temperature",
    categoryName: "Dermatological",
  },
  // Medical Supplies
  {
    sku: "SUP-MS-001",
    barcode: "8901234567080",
    name: "Disposable Syringes 5ml",
    generic_name: null,
    description: "Sterile disposable syringes with needle",
    item_type: "supply",
    dosage_form: null,
    strength: "5ml",
    manufacturer: "Hindustan Syringes",
    current_stock: 1000,
    minimum_stock: 200,
    maximum_stock: 2000,
    reorder_level: 300,
    unit_of_measure: "units",
    cost_price: 5.0,
    selling_price: 10.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep sterile",
    categoryName: "Medical Supplies",
  },
  {
    sku: "SUP-MS-002",
    barcode: "8901234567081",
    name: "Cotton Rolls 500g",
    generic_name: null,
    description: "Absorbent cotton for medical use",
    item_type: "supply",
    dosage_form: null,
    strength: null,
    manufacturer: "Jaycot Industries",
    current_stock: 200,
    minimum_stock: 50,
    maximum_stock: 400,
    reorder_level: 75,
    unit_of_measure: "rolls",
    cost_price: 80.0,
    selling_price: 120.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep dry",
    categoryName: "Medical Supplies",
  },
  {
    sku: "SUP-MS-003",
    barcode: "8901234567082",
    name: "Sterile Gauze Pads",
    generic_name: null,
    description: "Sterile gauze pads for wound dressing",
    item_type: "supply",
    dosage_form: null,
    strength: "4x4 inch",
    manufacturer: "Johnson & Johnson",
    current_stock: 500,
    minimum_stock: 100,
    maximum_stock: 1000,
    reorder_level: 150,
    unit_of_measure: "boxes",
    cost_price: 150.0,
    selling_price: 220.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep sterile",
    categoryName: "Medical Supplies",
  },
  // PPE
  {
    sku: "SUP-PPE-001",
    barcode: "8901234567090",
    name: "Surgical Masks (50 pack)",
    generic_name: null,
    description: "3-ply surgical face masks",
    item_type: "supply",
    dosage_form: null,
    strength: null,
    manufacturer: "Venus Safety",
    current_stock: 300,
    minimum_stock: 100,
    maximum_stock: 600,
    reorder_level: 150,
    unit_of_measure: "boxes",
    cost_price: 200.0,
    selling_price: 300.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep dry",
    categoryName: "Personal Protective Equipment",
  },
  {
    sku: "SUP-PPE-002",
    barcode: "8901234567091",
    name: "Nitrile Gloves (100 pack)",
    generic_name: null,
    description: "Powder-free nitrile examination gloves",
    item_type: "supply",
    dosage_form: null,
    strength: "Medium",
    manufacturer: "Supermax Healthcare",
    current_stock: 250,
    minimum_stock: 80,
    maximum_stock: 500,
    reorder_level: 120,
    unit_of_measure: "boxes",
    cost_price: 350.0,
    selling_price: 500.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, away from sunlight",
    categoryName: "Personal Protective Equipment",
  },
  {
    sku: "SUP-PPE-003",
    barcode: "8901234567092",
    name: "N95 Respirator Masks",
    generic_name: null,
    description: "N95 certified respiratory masks",
    item_type: "supply",
    dosage_form: null,
    strength: null,
    manufacturer: "3M India",
    current_stock: 150,
    minimum_stock: 50,
    maximum_stock: 300,
    reorder_level: 75,
    unit_of_measure: "boxes",
    cost_price: 800.0,
    selling_price: 1200.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep sealed",
    categoryName: "Personal Protective Equipment",
  },
  // Diagnostic Equipment
  {
    sku: "EQP-DG-001",
    barcode: "8901234567100",
    name: "Digital Thermometer",
    generic_name: null,
    description: "Digital clinical thermometer with LCD display",
    item_type: "equipment",
    dosage_form: null,
    strength: null,
    manufacturer: "Omron Healthcare",
    current_stock: 50,
    minimum_stock: 15,
    maximum_stock: 100,
    reorder_level: 25,
    unit_of_measure: "units",
    cost_price: 250.0,
    selling_price: 400.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Diagnostic Equipment",
  },
  {
    sku: "EQP-DG-002",
    barcode: "8901234567101",
    name: "Blood Pressure Monitor",
    generic_name: null,
    description: "Automatic digital blood pressure monitor",
    item_type: "equipment",
    dosage_form: null,
    strength: null,
    manufacturer: "Omron Healthcare",
    current_stock: 30,
    minimum_stock: 10,
    maximum_stock: 60,
    reorder_level: 15,
    unit_of_measure: "units",
    cost_price: 1500.0,
    selling_price: 2200.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, handle with care",
    categoryName: "Diagnostic Equipment",
  },
  {
    sku: "EQP-DG-003",
    barcode: "8901234567102",
    name: "Pulse Oximeter",
    generic_name: null,
    description: "Fingertip pulse oximeter with OLED display",
    item_type: "equipment",
    dosage_form: null,
    strength: null,
    manufacturer: "Dr. Trust",
    current_stock: 45,
    minimum_stock: 15,
    maximum_stock: 90,
    reorder_level: 25,
    unit_of_measure: "units",
    cost_price: 800.0,
    selling_price: 1200.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Diagnostic Equipment",
  },
  {
    sku: "EQP-DG-004",
    barcode: "8901234567103",
    name: "Glucometer Kit",
    generic_name: null,
    description: "Blood glucose monitoring system with strips",
    item_type: "equipment",
    dosage_form: null,
    strength: null,
    manufacturer: "Accu-Chek",
    current_stock: 40,
    minimum_stock: 10,
    maximum_stock: 80,
    reorder_level: 20,
    unit_of_measure: "units",
    cost_price: 1200.0,
    selling_price: 1800.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "Diagnostic Equipment",
  },
  // First Aid
  {
    sku: "SUP-FA-001",
    barcode: "8901234567110",
    name: "First Aid Kit - Basic",
    generic_name: null,
    description: "Complete basic first aid kit for home/office",
    item_type: "supply",
    dosage_form: null,
    strength: null,
    manufacturer: "St. John Ambulance",
    current_stock: 60,
    minimum_stock: 20,
    maximum_stock: 120,
    reorder_level: 30,
    unit_of_measure: "kits",
    cost_price: 500.0,
    selling_price: 750.0,
    requires_prescription: false,
    storage_conditions: "Room temperature",
    categoryName: "First Aid",
  },
  {
    sku: "SUP-FA-002",
    barcode: "8901234567111",
    name: "Antiseptic Solution 500ml",
    generic_name: "Povidone-Iodine",
    description: "Antiseptic solution for wound cleaning",
    item_type: "supply",
    dosage_form: "solution",
    strength: "5%",
    manufacturer: "Win-Medicare",
    current_stock: 180,
    minimum_stock: 50,
    maximum_stock: 350,
    reorder_level: 75,
    unit_of_measure: "bottles",
    cost_price: 60.0,
    selling_price: 95.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, protect from light",
    categoryName: "First Aid",
  },
  {
    sku: "SUP-FA-003",
    barcode: "8901234567112",
    name: "Bandage Rolls - Crepe",
    generic_name: null,
    description: "Elastic crepe bandage rolls",
    item_type: "supply",
    dosage_form: null,
    strength: "4 inch",
    manufacturer: "Datt Mediproducts",
    current_stock: 300,
    minimum_stock: 80,
    maximum_stock: 600,
    reorder_level: 120,
    unit_of_measure: "rolls",
    cost_price: 35.0,
    selling_price: 55.0,
    requires_prescription: false,
    storage_conditions: "Room temperature, keep dry",
    categoryName: "First Aid",
  },
  // Low stock items for testing alerts
  {
    sku: "MED-LS-001",
    barcode: "8901234567200",
    name: "Tramadol 50mg",
    generic_name: "Tramadol Hydrochloride",
    description: "Opioid analgesic for moderate pain",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "50mg",
    manufacturer: "Intas Pharma",
    current_stock: 15,
    minimum_stock: 30,
    maximum_stock: 200,
    reorder_level: 50,
    unit_of_measure: "strips",
    cost_price: 80.0,
    selling_price: 130.0,
    requires_prescription: true,
    is_controlled_substance: true,
    storage_conditions: "Room temperature",
    categoryName: "Pain Relief",
  },
  {
    sku: "MED-LS-002",
    barcode: "8901234567201",
    name: "Insulin Glargine",
    generic_name: "Insulin Glargine",
    description: "Long-acting insulin for diabetes",
    item_type: "medication",
    dosage_form: "injection",
    strength: "100 IU/ml",
    manufacturer: "Sanofi India",
    current_stock: 5,
    minimum_stock: 20,
    maximum_stock: 100,
    reorder_level: 30,
    unit_of_measure: "pens",
    cost_price: 650.0,
    selling_price: 850.0,
    requires_prescription: true,
    storage_conditions: "Refrigerate at 2-8°C",
    categoryName: "Diabetes Care",
  },
  // Out of stock item
  {
    sku: "MED-OS-001",
    barcode: "8901234567300",
    name: "Morphine Sulfate 10mg",
    generic_name: "Morphine Sulfate",
    description: "Opioid analgesic for severe pain",
    item_type: "medication",
    dosage_form: "tablet",
    strength: "10mg",
    manufacturer: "Sun Pharma",
    current_stock: 0,
    minimum_stock: 20,
    maximum_stock: 100,
    reorder_level: 30,
    unit_of_measure: "strips",
    cost_price: 120.0,
    selling_price: 180.0,
    requires_prescription: true,
    is_controlled_substance: true,
    storage_conditions: "Room temperature, secure storage",
    categoryName: "Pain Relief",
  },
];

// Helper to generate batch data
const generateBatches = (itemId, supplierId, quantity) => {
  const batches = [];
  const today = new Date();

  // Create 1-3 batches per item
  const numBatches = Math.floor(Math.random() * 3) + 1;
  let remainingQty = quantity;

  for (let i = 0; i < numBatches && remainingQty > 0; i++) {
    const batchQty =
      i === numBatches - 1
        ? remainingQty
        : Math.floor(remainingQty / (numBatches - i));
    const manufacturingDate = new Date(today);
    manufacturingDate.setMonth(
      manufacturingDate.getMonth() - Math.floor(Math.random() * 6) - 1
    );

    // Some items expire soon (for alerts), some later
    const expiryDate = new Date(manufacturingDate);
    const monthsToExpiry =
      Math.random() > 0.8
        ? Math.floor(Math.random() * 2) + 1
        : Math.floor(Math.random() * 24) + 6;
    expiryDate.setMonth(expiryDate.getMonth() + monthsToExpiry);

    batches.push({
      item_id: itemId,
      batch_number: `BATCH-${Date.now()}-${i}`,
      lot_number: `LOT-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
      quantity: batchQty,
      available_quantity: batchQty,
      manufacturing_date: manufacturingDate.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      received_date: new Date(
        manufacturingDate.getTime() + 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      supplier_id: supplierId,
      status: expiryDate < today ? "expired" : "active",
    });

    remainingQty -= batchQty;
  }

  return batches;
};

// Generate stock movements for an item
// Valid movement types: purchase, sale, adjustment, return, transfer, expired, damaged, dispensed, received
const generateStockMovements = (itemId, batchId, quantity) => {
  const movements = [];
  const today = new Date();

  // Initial received stock movement
  movements.push({
    item_id: itemId,
    batch_id: batchId,
    movement_type: "received",
    quantity: quantity,
    quantity_before: 0,
    quantity_after: quantity,
    reason: "Initial stock received",
    created_at: new Date(
      today.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  });

  // Add some random dispensed movements
  let currentStock = quantity;
  const numMovements = Math.floor(Math.random() * 5) + 1;

  for (let i = 0; i < numMovements && currentStock > 10; i++) {
    const dispensedQty =
      Math.floor(Math.random() * Math.min(10, currentStock - 5)) + 1;
    const daysAgo = Math.floor(Math.random() * 25);

    movements.push({
      item_id: itemId,
      batch_id: batchId,
      movement_type: "dispensed",
      quantity: dispensedQty,
      quantity_before: currentStock,
      quantity_after: currentStock - dispensedQty,
      reason: "Dispensed to patient",
      created_at: new Date(
        today.getTime() - daysAgo * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    currentStock -= dispensedQty;
  }

  return movements;
};

const seedInventory = async () => {
  console.log("🌱 Starting inventory seed...\n");

  try {
    // 1. Seed Categories
    console.log("📁 Creating categories...");
    const { data: createdCategories, error: catError } = await supabase
      .from("inventory_categories")
      .upsert(categories, { onConflict: "name" })
      .select();

    if (catError) {
      console.error("Error creating categories:", catError);
      return;
    }
    console.log(`   ✓ Created ${createdCategories.length} categories`);

    // Create category lookup map
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat.id;
    });

    // 2. Seed Suppliers
    console.log("🏢 Creating suppliers...");

    // First, check if suppliers already exist
    const { data: existingSuppliers } = await supabase
      .from("inventory_suppliers")
      .select("id, name");

    let createdSuppliers = existingSuppliers || [];

    if (!existingSuppliers || existingSuppliers.length === 0) {
      const { data: newSuppliers, error: supError } = await supabase
        .from("inventory_suppliers")
        .insert(suppliers)
        .select();

      if (supError) {
        console.error("Error creating suppliers:", supError);
        return;
      }
      createdSuppliers = newSuppliers;
    }
    console.log(`   ✓ ${createdSuppliers.length} suppliers available`);

    // 3. Seed Inventory Items
    console.log("📦 Creating inventory items...");
    const itemsToInsert = inventoryItems.map((item) => {
      const { categoryName, ...itemData } = item;
      return {
        ...itemData,
        category_id: categoryMap[categoryName] || null,
        supplier_id:
          createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)]
            .id,
      };
    });

    const { data: createdItems, error: itemError } = await supabase
      .from("inventory_items")
      .upsert(itemsToInsert, { onConflict: "sku" })
      .select();

    if (itemError) {
      console.error("Error creating items:", itemError);
      return;
    }
    console.log(`   ✓ Created ${createdItems.length} inventory items`);

    // 4. Create Batches for each item
    console.log("📋 Creating inventory batches...");
    let totalBatches = 0;

    for (const item of createdItems) {
      if (item.current_stock > 0) {
        const batches = generateBatches(
          item.id,
          item.supplier_id,
          item.current_stock
        );

        const { error: batchError } = await supabase
          .from("inventory_batches")
          .insert(batches);

        if (batchError) {
          console.error(`Error creating batches for ${item.name}:`, batchError);
        } else {
          totalBatches += batches.length;
        }
      }
    }
    console.log(`   ✓ Created ${totalBatches} batches`);

    // 5. Create Stock Movements
    console.log("📊 Creating stock movements...");
    let totalMovements = 0;

    // Get all batches
    const { data: allBatches } = await supabase
      .from("inventory_batches")
      .select("id, item_id, quantity");

    if (allBatches) {
      for (const batch of allBatches.slice(0, 30)) {
        // Limit to first 30 batches
        const movements = generateStockMovements(
          batch.item_id,
          batch.id,
          batch.quantity
        );

        const { error: movError } = await supabase
          .from("inventory_stock_movements")
          .insert(movements);

        if (movError) {
          console.error("Error creating movements:", movError);
        } else {
          totalMovements += movements.length;
        }
      }
    }
    console.log(`   ✓ Created ${totalMovements} stock movements`);

    // 6. Create some alerts
    console.log("⚠️  Creating inventory alerts...");
    const alertItems = createdItems.filter(
      (item) => item.current_stock <= item.minimum_stock
    );

    const alerts = alertItems.map((item) => ({
      item_id: item.id,
      alert_type: item.current_stock === 0 ? "out_of_stock" : "low_stock",
      severity: item.current_stock === 0 ? "critical" : "high",
      message:
        item.current_stock === 0
          ? `${item.name} is out of stock`
          : `${item.name} is running low (${item.current_stock} ${item.unit_of_measure} remaining)`,
      is_resolved: false,
    }));

    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from("inventory_alerts")
        .insert(alerts);

      if (alertError) {
        console.error("Error creating alerts:", alertError);
      } else {
        console.log(`   ✓ Created ${alerts.length} alerts`);
      }
    }

    // Add expiry alerts for items expiring soon
    const { data: expiringBatches } = await supabase
      .from("inventory_batches")
      .select(
        "id, item_id, batch_number, expiry_date, item:inventory_items(name)"
      )
      .lte(
        "expiry_date",
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      )
      .eq("status", "active");

    if (expiringBatches && expiringBatches.length > 0) {
      const expiryAlerts = expiringBatches.map((batch) => {
        const daysUntilExpiry = Math.ceil(
          (new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return {
          item_id: batch.item_id,
          batch_id: batch.id,
          alert_type: daysUntilExpiry <= 0 ? "expired" : "expiring_soon",
          severity:
            daysUntilExpiry <= 0
              ? "critical"
              : daysUntilExpiry <= 7
              ? "high"
              : "medium",
          message:
            daysUntilExpiry <= 0
              ? `Batch ${batch.batch_number} of ${batch.item?.name} has expired`
              : `Batch ${batch.batch_number} of ${batch.item?.name} expires in ${daysUntilExpiry} days`,
          is_resolved: false,
        };
      });

      const { error: expiryAlertError } = await supabase
        .from("inventory_alerts")
        .insert(expiryAlerts);

      if (expiryAlertError) {
        console.error("Error creating expiry alerts:", expiryAlertError);
      } else {
        console.log(`   ✓ Created ${expiryAlerts.length} expiry alerts`);
      }
    }

    console.log("\n✅ Inventory seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Suppliers: ${createdSuppliers.length}`);
    console.log(`   - Items: ${createdItems.length}`);
    console.log(`   - Batches: ${totalBatches}`);
    console.log(`   - Stock Movements: ${totalMovements}`);
    console.log(
      `   - Alerts: ${alerts.length + (expiringBatches?.length || 0)}`
    );
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
};

// Run the seed
seedInventory();
