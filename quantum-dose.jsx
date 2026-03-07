import { useState, useEffect, useRef } from "react";

const DRUGS = [
  { id: "warfarin", label: "Warfarin", category: "Anticoagulant" },
  { id: "apixaban", label: "Apixaban", category: "Anticoagulant" },
  { id: "rivaroxaban", label: "Rivaroxaban", category: "Anticoagulant" },
  { id: "clopidogrel", label: "Clopidogrel", category: "Antiplatelet" },
  { id: "aspirin", label: "Aspirin", category: "Antiplatelet / NSAID" },
  { id: "ticagrelor", label: "Ticagrelor", category: "Antiplatelet" },
  { id: "heparin", label: "Heparin", category: "Anticoagulant" },
  { id: "lisinopril", label: "Lisinopril", category: "ACE Inhibitor" },
  { id: "enalapril", label: "Enalapril", category: "ACE Inhibitor" },
  { id: "ramipril", label: "Ramipril", category: "ACE Inhibitor" },
  { id: "losartan", label: "Losartan", category: "ARB" },
  { id: "valsartan", label: "Valsartan", category: "ARB" },
  { id: "irbesartan", label: "Irbesartan", category: "ARB" },
  { id: "metoprolol", label: "Metoprolol", category: "Beta Blocker" },
  { id: "carvedilol", label: "Carvedilol", category: "Beta Blocker" },
  { id: "atenolol", label: "Atenolol", category: "Beta Blocker" },
  { id: "bisoprolol", label: "Bisoprolol", category: "Beta Blocker" },
  { id: "amlodipine", label: "Amlodipine", category: "Calcium Channel Blocker" },
  { id: "diltiazem", label: "Diltiazem", category: "Calcium Channel Blocker" },
  { id: "verapamil", label: "Verapamil", category: "Calcium Channel Blocker" },
  { id: "nifedipine", label: "Nifedipine", category: "Calcium Channel Blocker" },
  { id: "amiodarone", label: "Amiodarone", category: "Antiarrhythmic" },
  { id: "digoxin", label: "Digoxin", category: "Cardiac Glycoside" },
  { id: "furosemide", label: "Furosemide", category: "Loop Diuretic" },
  { id: "hydrochlorothiazide", label: "Hydrochlorothiazide", category: "Thiazide Diuretic" },
  { id: "spironolactone", label: "Spironolactone", category: "K-Sparing Diuretic" },
  { id: "nitroglycerin", label: "Nitroglycerin", category: "Nitrate" },
  { id: "isosorbide", label: "Isosorbide Mononitrate", category: "Nitrate" },
  { id: "simvastatin", label: "Simvastatin", category: "Statin" },
  { id: "atorvastatin", label: "Atorvastatin", category: "Statin" },
  { id: "rosuvastatin", label: "Rosuvastatin", category: "Statin" },
  { id: "pravastatin", label: "Pravastatin", category: "Statin" },
  { id: "ezetimibe", label: "Ezetimibe", category: "Lipid-Lowering" },
  { id: "fenofibrate", label: "Fenofibrate", category: "Fibrate" },
  { id: "metformin", label: "Metformin", category: "Antidiabetic" },
  { id: "glipizide", label: "Glipizide", category: "Sulfonylurea" },
  { id: "glyburide", label: "Glyburide", category: "Sulfonylurea" },
  { id: "glimepiride", label: "Glimepiride", category: "Sulfonylurea" },
  { id: "sitagliptin", label: "Sitagliptin", category: "DPP-4 Inhibitor" },
  { id: "empagliflozin", label: "Empagliflozin", category: "SGLT2 Inhibitor" },
  { id: "dapagliflozin", label: "Dapagliflozin", category: "SGLT2 Inhibitor" },
  { id: "semaglutide", label: "Semaglutide", category: "GLP-1 Agonist" },
  { id: "liraglutide", label: "Liraglutide", category: "GLP-1 Agonist" },
  { id: "insulin_glargine", label: "Insulin Glargine", category: "Insulin" },
  { id: "insulin_aspart", label: "Insulin Aspart", category: "Insulin" },
  { id: "pioglitazone", label: "Pioglitazone", category: "Thiazolidinedione" },
  { id: "omeprazole", label: "Omeprazole", category: "PPI" },
  { id: "pantoprazole", label: "Pantoprazole", category: "PPI" },
  { id: "esomeprazole", label: "Esomeprazole", category: "PPI" },
  { id: "lansoprazole", label: "Lansoprazole", category: "PPI" },
  { id: "famotidine", label: "Famotidine", category: "H2 Blocker" },
  { id: "metoclopramide", label: "Metoclopramide", category: "Prokinetic" },
  { id: "ondansetron", label: "Ondansetron", category: "Antiemetic" },
  { id: "albuterol", label: "Albuterol", category: "Beta-2 Agonist" },
  { id: "salmeterol", label: "Salmeterol", category: "LABA" },
  { id: "tiotropium", label: "Tiotropium", category: "Anticholinergic" },
  { id: "fluticasone", label: "Fluticasone", category: "Inhaled Steroid" },
  { id: "montelukast", label: "Montelukast", category: "Leukotriene Modifier" },
  { id: "theophylline", label: "Theophylline", category: "Methylxanthine" },
  { id: "levothyroxine", label: "Levothyroxine", category: "Thyroid" },
  { id: "methimazole", label: "Methimazole", category: "Antithyroid" },
  { id: "ibuprofen", label: "Ibuprofen", category: "NSAID" },
  { id: "naproxen", label: "Naproxen", category: "NSAID" },
  { id: "celecoxib", label: "Celecoxib", category: "COX-2 Inhibitor" },
  { id: "diclofenac", label: "Diclofenac", category: "NSAID" },
  { id: "indomethacin", label: "Indomethacin", category: "NSAID" },
  { id: "acetaminophen", label: "Acetaminophen", category: "Analgesic" },
  { id: "tramadol", label: "Tramadol", category: "Opioid-like Analgesic" },
  { id: "oxycodone", label: "Oxycodone", category: "Opioid" },
  { id: "hydrocodone", label: "Hydrocodone", category: "Opioid" },
  { id: "morphine", label: "Morphine", category: "Opioid" },
  { id: "fentanyl", label: "Fentanyl", category: "Opioid" },
  { id: "codeine", label: "Codeine", category: "Opioid" },
  { id: "buprenorphine", label: "Buprenorphine", category: "Partial Opioid Agonist" },
  { id: "naloxone", label: "Naloxone", category: "Opioid Antagonist" },
  { id: "fluoxetine", label: "Fluoxetine", category: "SSRI" },
  { id: "sertraline", label: "Sertraline", category: "SSRI" },
  { id: "paroxetine", label: "Paroxetine", category: "SSRI" },
  { id: "escitalopram", label: "Escitalopram", category: "SSRI" },
  { id: "citalopram", label: "Citalopram", category: "SSRI" },
  { id: "venlafaxine", label: "Venlafaxine", category: "SNRI" },
  { id: "duloxetine", label: "Duloxetine", category: "SNRI" },
  { id: "bupropion", label: "Bupropion", category: "NDRI / Smoking Cessation" },
  { id: "mirtazapine", label: "Mirtazapine", category: "Antidepressant" },
  { id: "amitriptyline", label: "Amitriptyline", category: "Tricyclic Antidepressant" },
  { id: "nortriptyline", label: "Nortriptyline", category: "Tricyclic Antidepressant" },
  { id: "lithium", label: "Lithium", category: "Mood Stabilizer" },
  { id: "valproate", label: "Valproate", category: "Mood Stabilizer / Anticonvulsant" },
  { id: "carbamazepine", label: "Carbamazepine", category: "Anticonvulsant" },
  { id: "lamotrigine", label: "Lamotrigine", category: "Anticonvulsant" },
  { id: "topiramate", label: "Topiramate", category: "Anticonvulsant" },
  { id: "levetiracetam", label: "Levetiracetam", category: "Anticonvulsant" },
  { id: "phenytoin", label: "Phenytoin", category: "Anticonvulsant" },
  { id: "clonazepam", label: "Clonazepam", category: "Benzodiazepine" },
  { id: "lorazepam", label: "Lorazepam", category: "Benzodiazepine" },
  { id: "diazepam", label: "Diazepam", category: "Benzodiazepine" },
  { id: "alprazolam", label: "Alprazolam", category: "Benzodiazepine" },
  { id: "zolpidem", label: "Zolpidem", category: "Sleep Aid" },
  { id: "quetiapine", label: "Quetiapine", category: "Antipsychotic" },
  { id: "olanzapine", label: "Olanzapine", category: "Antipsychotic" },
  { id: "risperidone", label: "Risperidone", category: "Antipsychotic" },
  { id: "aripiprazole", label: "Aripiprazole", category: "Antipsychotic" },
  { id: "haloperidol", label: "Haloperidol", category: "Antipsychotic" },
  { id: "donepezil", label: "Donepezil", category: "Cholinesterase Inhibitor" },
  { id: "memantine", label: "Memantine", category: "NMDA Antagonist" },
  { id: "methylphenidate", label: "Methylphenidate", category: "CNS Stimulant" },
  { id: "amphetamine", label: "Amphetamine / Adderall", category: "CNS Stimulant" },
  { id: "amoxicillin", label: "Amoxicillin", category: "Penicillin Antibiotic" },
  { id: "augmentin", label: "Amoxicillin-Clavulanate", category: "Penicillin Antibiotic" },
  { id: "ciprofloxacin", label: "Ciprofloxacin", category: "Fluoroquinolone" },
  { id: "levofloxacin", label: "Levofloxacin", category: "Fluoroquinolone" },
  { id: "doxycycline", label: "Doxycycline", category: "Tetracycline" },
  { id: "azithromycin", label: "Azithromycin", category: "Macrolide" },
  { id: "clarithromycin", label: "Clarithromycin", category: "Macrolide" },
  { id: "trimethoprim", label: "Trimethoprim-Sulfamethoxazole", category: "Sulfonamide" },
  { id: "metronidazole", label: "Metronidazole", category: "Antibiotic / Antiprotozoal" },
  { id: "fluconazole", label: "Fluconazole", category: "Antifungal" },
  { id: "itraconazole", label: "Itraconazole", category: "Antifungal" },
  { id: "vancomycin", label: "Vancomycin", category: "Glycopeptide Antibiotic" },
  { id: "linezolid", label: "Linezolid", category: "Oxazolidinone Antibiotic" },
  { id: "methotrexate", label: "Methotrexate", category: "Immunosuppressant / DMARD" },
  { id: "hydroxychloroquine", label: "Hydroxychloroquine", category: "DMARD / Antimalarial" },
  { id: "sulfasalazine", label: "Sulfasalazine", category: "DMARD" },
  { id: "leflunomide", label: "Leflunomide", category: "DMARD" },
  { id: "azathioprine", label: "Azathioprine", category: "Immunosuppressant" },
  { id: "cyclosporine", label: "Cyclosporine", category: "Immunosuppressant" },
  { id: "tacrolimus", label: "Tacrolimus", category: "Immunosuppressant" },
  { id: "mycophenolate", label: "Mycophenolate", category: "Immunosuppressant" },
  { id: "prednisone", label: "Prednisone", category: "Corticosteroid" },
  { id: "methylprednisolone", label: "Methylprednisolone", category: "Corticosteroid" },
  { id: "dexamethasone", label: "Dexamethasone", category: "Corticosteroid" },
  { id: "colchicine", label: "Colchicine", category: "Gout Treatment" },
  { id: "allopurinol", label: "Allopurinol", category: "Xanthine Oxidase Inhibitor" },
  { id: "febuxostat", label: "Febuxostat", category: "Gout Treatment" },
  { id: "tamoxifen", label: "Tamoxifen", category: "Hormone Therapy" },
  { id: "letrozole", label: "Letrozole", category: "Aromatase Inhibitor" },
  { id: "sildenafil", label: "Sildenafil", category: "PDE5 Inhibitor" },
  { id: "tadalafil", label: "Tadalafil", category: "PDE5 Inhibitor" },
  { id: "finasteride", label: "Finasteride", category: "5-Alpha Reductase Inhibitor" },
  { id: "tamsulosin", label: "Tamsulosin", category: "Alpha Blocker" },
  { id: "doxazosin", label: "Doxazosin", category: "Alpha Blocker" },
  { id: "gabapentin", label: "Gabapentin", category: "Neuropathic Pain" },
  { id: "pregabalin", label: "Pregabalin", category: "Neuropathic Pain" },
  { id: "baclofen", label: "Baclofen", category: "Muscle Relaxant" },
  { id: "cyclobenzaprine", label: "Cyclobenzaprine", category: "Muscle Relaxant" },
  { id: "tizanidine", label: "Tizanidine", category: "Muscle Relaxant" },
  { id: "ritonavir", label: "Ritonavir", category: "HIV Protease Inhibitor" },
  { id: "atazanavir", label: "Atazanavir", category: "HIV Protease Inhibitor" },
  { id: "efavirenz", label: "Efavirenz", category: "HIV NNRTI" },
  { id: "tenofovir", label: "Tenofovir", category: "HIV NRTI" },
  { id: "aliskiren", label: "Aliskiren", category: "Direct Renin Inhibitor" },
  { id: "colestipol", label: "Colestipol", category: "Bile Acid Sequestrant" },
];

const DRUG_INDEX = Object.fromEntries(DRUGS.map((d, i) => [d.id, i]));
const N = DRUGS.length;

const INTERACTIONS = [
  ["warfarin","aspirin",0.90,"Combined anticoagulant + antiplatelet — major bleeding risk"],
  ["warfarin","ibuprofen",0.85,"NSAIDs displace warfarin from protein binding, elevate INR"],
  ["warfarin","naproxen",0.82,"NSAID potentiates anticoagulant effect"],
  ["warfarin","diclofenac",0.80,"COX inhibition increases bleeding risk"],
  ["warfarin","celecoxib",0.72,"Even COX-2 selective agents raise GI bleed risk with warfarin"],
  ["warfarin","amiodarone",0.95,"Amiodarone inhibits CYP2C9 — warfarin levels can double"],
  ["warfarin","ciprofloxacin",0.80,"Fluoroquinolones potentiate anticoagulant effect"],
  ["warfarin","levofloxacin",0.78,"Fluoroquinolone warfarin potentiation"],
  ["warfarin","fluconazole",0.90,"Strong CYP2C9 inhibition — major warfarin toxicity"],
  ["warfarin","metronidazole",0.88,"Inhibits warfarin metabolism via CYP2C9"],
  ["warfarin","clarithromycin",0.82,"Macrolide raises warfarin levels via CYP inhibition"],
  ["warfarin","azithromycin",0.70,"Moderate INR elevation reported"],
  ["warfarin","fluoxetine",0.72,"SSRIs increase bleeding risk with anticoagulants"],
  ["warfarin","simvastatin",0.62,"Statins can modestly elevate INR"],
  ["warfarin","methotrexate",0.80,"Both hepatotoxic; combined anticoagulant risk"],
  ["warfarin","valproate",0.75,"Valproate displaces warfarin from plasma proteins"],
  ["warfarin","tamoxifen",0.85,"Tamoxifen inhibits CYP2C9, raising warfarin levels"],
  ["warfarin","trimethoprim",0.85,"Sulfonamide component strongly inhibits warfarin metabolism"],
  ["warfarin","phenytoin",0.78,"Complex interaction — variable warfarin effect"],
  ["warfarin","carbamazepine",0.80,"CYP2C9 induction reduces warfarin efficacy"],
  ["warfarin","levothyroxine",0.72,"Thyroid hormones enhance warfarin effect"],
  ["aspirin","clopidogrel",0.76,"Dual antiplatelet — high GI bleed risk"],
  ["aspirin","ticagrelor",0.78,"Triple pathway inhibition — major bleeding risk"],
  ["aspirin","ibuprofen",0.72,"Ibuprofen blocks aspirin's cardioprotective platelet binding"],
  ["aspirin","naproxen",0.68,"Competitive COX-1 inhibition reduces aspirin cardioprotection"],
  ["aspirin","methotrexate",0.85,"NSAIDs reduce methotrexate renal clearance → toxicity"],
  ["aspirin","lithium",0.70,"NSAIDs reduce lithium excretion"],
  ["aspirin","valproate",0.70,"Aspirin displaces valproate — elevated free levels"],
  ["clopidogrel","omeprazole",0.80,"Omeprazole inhibits CYP2C19 — clopidogrel activation reduced"],
  ["clopidogrel","esomeprazole",0.78,"CYP2C19 inhibition reduces clopidogrel efficacy"],
  ["clopidogrel","fluoxetine",0.62,"Fluoxetine inhibits CYP2C19, reducing clopidogrel effect"],
  ["clopidogrel","ticagrelor",0.70,"Overlapping antiplatelet mechanism — additive bleeding"],
  ["lisinopril","ibuprofen",0.75,"NSAIDs blunt ACE inhibitor effect, worsen renal function"],
  ["lisinopril","naproxen",0.72,"NSAID-ACE inhibitor renal and antihypertensive interaction"],
  ["lisinopril","spironolactone",0.78,"Hyperkalemia risk — potassium retention overlap"],
  ["lisinopril","lithium",0.82,"ACE inhibitors reduce lithium excretion → toxicity"],
  ["lisinopril","aliskiren",0.80,"Dual RAAS blockade — acute kidney injury risk"],
  ["lisinopril","trimethoprim",0.75,"Both raise potassium — hyperkalemia risk"],
  ["losartan","ibuprofen",0.72,"NSAIDs reduce ARB antihypertensive effect"],
  ["losartan","spironolactone",0.75,"Hyperkalemia risk with combined RAAS blockade"],
  ["losartan","lithium",0.78,"ARBs reduce lithium clearance"],
  ["valsartan","spironolactone",0.75,"Hyperkalemia with RAAS + K-sparing diuretic"],
  ["metoprolol","verapamil",0.88,"Both slow AV node — risk of complete heart block"],
  ["metoprolol","diltiazem",0.85,"Combined AV nodal suppression — bradycardia/block"],
  ["metoprolol","amiodarone",0.82,"Additive bradycardia and AV block risk"],
  ["carvedilol","verapamil",0.85,"AV block, severe bradycardia risk"],
  ["atenolol","verapamil",0.85,"Heart block risk — avoid combination"],
  ["verapamil","simvastatin",0.80,"CYP3A4 inhibition by verapamil raises simvastatin → myopathy"],
  ["diltiazem","simvastatin",0.78,"CYP3A4 inhibition — simvastatin myopathy risk"],
  ["verapamil","digoxin",0.85,"Verapamil raises digoxin levels via P-gp inhibition"],
  ["diltiazem","digoxin",0.80,"Digoxin levels increase"],
  ["amlodipine","simvastatin",0.62,"Modest CYP3A4 inhibition raises simvastatin"],
  ["amiodarone","simvastatin",0.90,"CYP3A4 inhibition — major simvastatin myopathy risk"],
  ["amiodarone","digoxin",0.92,"Amiodarone doubles digoxin levels — toxicity"],
  ["amiodarone","metoprolol",0.82,"Additive bradycardia and conduction slowing"],
  ["amiodarone","phenytoin",0.80,"Amiodarone inhibits phenytoin metabolism"],
  ["amiodarone","cyclosporine",0.78,"Nephrotoxicity and cyclosporine level elevation"],
  ["digoxin","ciprofloxacin",0.75,"Antibiotics alter gut flora — digoxin absorption increases"],
  ["digoxin","clarithromycin",0.80,"P-glycoprotein inhibition raises digoxin levels"],
  ["digoxin","azithromycin",0.70,"Moderate digoxin level elevation"],
  ["fluoxetine","tramadol",0.95,"Serotonin syndrome — potentially life-threatening"],
  ["fluoxetine","lithium",0.72,"Combined serotonergic — serotonin syndrome risk"],
  ["fluoxetine","amitriptyline",0.88,"Fluoxetine inhibits TCA metabolism + serotonin syndrome"],
  ["fluoxetine","nortriptyline",0.85,"TCA toxicity and serotonin syndrome risk"],
  ["fluoxetine","linezolid",0.93,"Linezolid is a weak MAO inhibitor — severe serotonin syndrome"],
  ["sertraline","tramadol",0.88,"Serotonin syndrome risk"],
  ["sertraline","linezolid",0.92,"Serotonin syndrome — contraindicated"],
  ["sertraline","amitriptyline",0.80,"Serotonin + TCA toxicity"],
  ["venlafaxine","tramadol",0.88,"Dual serotonergic — serotonin syndrome"],
  ["venlafaxine","linezolid",0.92,"Serotonin syndrome — avoid"],
  ["duloxetine","tramadol",0.85,"Serotonin syndrome risk"],
  ["duloxetine","linezolid",0.90,"Serotonin syndrome"],
  ["amitriptyline","haloperidol",0.78,"Combined QT prolongation — torsades risk"],
  ["amitriptyline","ondansetron",0.72,"Additive QT prolongation"],
  ["tramadol","diazepam",0.78,"CNS and respiratory depression"],
  ["tramadol","lorazepam",0.78,"CNS and respiratory depression"],
  ["tramadol","lithium",0.65,"Tramadol lowers seizure threshold"],
  ["oxycodone","diazepam",0.82,"Opioid + benzodiazepine — respiratory depression, FDA black box warning"],
  ["oxycodone","lorazepam",0.82,"Opioid + benzodiazepine — respiratory depression"],
  ["oxycodone","gabapentin",0.78,"Additive CNS and respiratory depression"],
  ["morphine","lorazepam",0.82,"Opioid + benzodiazepine — respiratory depression"],
  ["hydrocodone","diazepam",0.80,"Opioid + benzodiazepine risk"],
  ["hydrocodone","gabapentin",0.75,"Additive sedation and respiratory depression"],
  ["fentanyl","diazepam",0.85,"High risk respiratory depression"],
  ["codeine","fluoxetine",0.80,"Fluoxetine inhibits CYP2D6 — codeine conversion blocked or toxic"],
  ["simvastatin","clarithromycin",0.88,"CYP3A4 inhibition — simvastatin myopathy"],
  ["simvastatin","itraconazole",0.90,"Strong CYP3A4 inhibitor — simvastatin contraindicated"],
  ["simvastatin","ritonavir",0.92,"HIV protease inhibitors strongly inhibit CYP3A4"],
  ["atorvastatin","clarithromycin",0.80,"CYP3A4 inhibition raises atorvastatin"],
  ["atorvastatin","itraconazole",0.85,"CYP3A4 inhibition — myopathy risk"],
  ["atorvastatin","ritonavir",0.88,"HIV PI inhibits CYP3A4"],
  ["rosuvastatin","cyclosporine",0.85,"Cyclosporine raises rosuvastatin via OATP inhibition"],
  ["cyclosporine","ibuprofen",0.80,"Additive nephrotoxicity"],
  ["cyclosporine","naproxen",0.78,"NSAID nephrotoxicity with cyclosporine"],
  ["cyclosporine","tacrolimus",0.85,"Additive nephrotoxicity"],
  ["cyclosporine","simvastatin",0.82,"Cyclosporine raises statin levels — myopathy"],
  ["tacrolimus","ibuprofen",0.78,"Nephrotoxicity risk"],
  ["tacrolimus","fluconazole",0.88,"CYP3A4 inhibition raises tacrolimus to toxic levels"],
  ["tacrolimus","clarithromycin",0.85,"CYP3A4 inhibition — tacrolimus toxicity"],
  ["methotrexate","trimethoprim",0.90,"Both inhibit dihydrofolate reductase — severe folate deficiency"],
  ["methotrexate","ibuprofen",0.85,"NSAIDs reduce methotrexate renal clearance → toxicity"],
  ["methotrexate","naproxen",0.82,"NSAID reduces methotrexate clearance"],
  ["methotrexate","ciprofloxacin",0.72,"Reduced renal clearance of methotrexate"],
  ["methotrexate","omeprazole",0.65,"PPIs reduce methotrexate clearance"],
  ["azathioprine","allopurinol",0.92,"Allopurinol inhibits azathioprine metabolism — major toxicity"],
  ["mycophenolate","omeprazole",0.60,"PPIs reduce mycophenolate absorption"],
  ["lithium","ibuprofen",0.85,"NSAIDs reduce lithium renal clearance → toxicity"],
  ["lithium","naproxen",0.82,"NSAID-lithium interaction — toxicity risk"],
  ["lithium","celecoxib",0.78,"COX-2 inhibitors raise lithium levels"],
  ["lithium","furosemide",0.78,"Diuretic-induced sodium depletion raises lithium"],
  ["lithium","hydrochlorothiazide",0.80,"Thiazide diuretics raise lithium levels"],
  ["lithium","spironolactone",0.70,"May raise lithium levels"],
  ["lithium","carbamazepine",0.72,"Additive neurotoxicity despite normal levels"],
  ["carbamazepine","valproate",0.75,"Pharmacokinetic interaction — variable effects on both"],
  ["carbamazepine","lamotrigine",0.70,"Carbamazepine induces lamotrigine metabolism — reduced levels"],
  ["carbamazepine","warfarin",0.80,"CYP induction reduces warfarin efficacy"],
  ["phenytoin","valproate",0.75,"Valproate raises free phenytoin levels"],
  ["valproate","lamotrigine",0.80,"Valproate inhibits lamotrigine metabolism — toxicity risk"],
  ["allopurinol","azathioprine",0.92,"Xanthine oxidase inhibition raises 6-mercaptopurine — major toxicity"],
  ["colchicine","clarithromycin",0.82,"CYP3A4 inhibition raises colchicine — life-threatening toxicity"],
  ["colchicine","cyclosporine",0.85,"P-glycoprotein inhibition — colchicine toxicity"],
  ["sildenafil","nitroglycerin",0.98,"Severe hypotension — potentially fatal combination"],
  ["sildenafil","isosorbide",0.97,"Nitrate + PDE5 inhibitor — severe hypotension, contraindicated"],
  ["tadalafil","nitroglycerin",0.97,"Same as sildenafil + nitrate interaction"],
  ["tadalafil","isosorbide",0.96,"Contraindicated — severe hypotension"],
  ["tamsulosin","sildenafil",0.78,"Combined alpha + PDE5 blockade — significant hypotension"],
  ["doxazosin","sildenafil",0.80,"Alpha blocker + PDE5 inhibitor — hypotension"],
  ["fluconazole","carbamazepine",0.72,"Fluconazole inhibits CYP2C9, raising carbamazepine"],
  ["fluconazole","haloperidol",0.78,"Both prolong QT — additive risk"],
  ["itraconazole","digoxin",0.80,"P-glycoprotein inhibition raises digoxin"],
  ["itraconazole","tacrolimus",0.88,"CYP3A4 inhibition — tacrolimus toxicity"],
  ["itraconazole","cyclosporine",0.85,"CYP3A4 inhibition — nephrotoxicity risk"],
  ["prednisone","ibuprofen",0.75,"Additive GI ulcer and bleeding risk"],
  ["prednisone","aspirin",0.72,"Additive GI adverse effects"],
  ["prednisone","warfarin",0.70,"Corticosteroids can variably affect INR"],
  ["haloperidol","ondansetron",0.80,"Combined QT prolongation — torsades risk"],
  ["haloperidol","ciprofloxacin",0.78,"Both prolong QT interval"],
  ["azithromycin","ondansetron",0.75,"Additive QT prolongation"],
  ["azithromycin","haloperidol",0.78,"Additive QT prolongation"],
  ["furosemide","lithium",0.78,"Loop diuretic raises lithium via sodium depletion"],
  ["hydrochlorothiazide","lithium",0.80,"Thiazide raises lithium — common but dangerous"],
  ["ritonavir","simvastatin",0.92,"CYP3A4 inhibition — simvastatin contraindicated with ritonavir"],
  ["ritonavir","atorvastatin",0.85,"Substantial statin level increase"],
  ["ritonavir","sildenafil",0.88,"Massive PDE5 inhibitor increase — toxicity risk"],
  ["ritonavir","carbamazepine",0.82,"Bidirectional complex pharmacokinetic interaction"],
  ["bupropion","tramadol",0.82,"Both lower seizure threshold — seizure risk"],
  ["bupropion","linezolid",0.88,"Norepinephrine/serotonin toxicity risk"],
  ["metoclopramide","haloperidol",0.75,"Additive dopamine blockade — EPS risk"],
  ["ondansetron","citalopram",0.80,"Both prolong QT — additive risk"],
  ["ondansetron","escitalopram",0.78,"QT prolongation — additive risk"],
  ["theophylline","ciprofloxacin",0.85,"Ciprofloxacin inhibits CYP1A2 — theophylline toxicity"],
  ["theophylline","clarithromycin",0.80,"Macrolide raises theophylline levels"],
  ["tamoxifen","fluoxetine",0.80,"Fluoxetine inhibits CYP2D6 — tamoxifen activation reduced"],
  ["tamoxifen","paroxetine",0.85,"Paroxetine is strongest CYP2D6 inhibitor — tamoxifen failure risk"],
  ["levothyroxine","omeprazole",0.60,"PPI reduces levothyroxine absorption"],
  ["gabapentin","morphine",0.78,"Additive CNS and respiratory depression"],
  ["pregabalin","oxycodone",0.78,"CNS depression — respiratory risk"],
  ["pregabalin","lorazepam",0.80,"Additive CNS depression"],
  ["cyclobenzaprine","fluoxetine",0.82,"Both serotonergic — serotonin syndrome risk"],
  ["cyclobenzaprine","tramadol",0.82,"Serotonin syndrome + seizure risk"],
  ["tizanidine","ciprofloxacin",0.92,"CYP1A2 inhibition — tizanidine rises dramatically — hypotension/sedation"],
  ["tizanidine","fluoxetine",0.75,"CYP1A2 inhibition raises tizanidine levels"],
  ["escitalopram","citalopram",0.80,"Both prolong QT — never combine"],
  ["hydroxychloroquine","ondansetron",0.72,"Additive QT prolongation"],
  ["hydroxychloroquine","haloperidol",0.75,"Additive QT prolongation"],
  ["metformin","ciprofloxacin",0.55,"Fluoroquinolones can affect blood glucose with antidiabetics"],
  ["gabapentin","lorazepam",0.75,"Additive CNS/respiratory depression"],
  ["pregabalin","diazepam",0.78,"Additive CNS depression — respiratory risk"],
];

function buildAdjMatrix() {
  const mat = Array.from({ length: N }, () => new Float32Array(N));
  for (const [a, b, sev] of INTERACTIONS) {
    const i = DRUG_INDEX[a], j = DRUG_INDEX[b];
    if (i !== undefined && j !== undefined) { mat[i][j] = sev; mat[j][i] = sev; }
  }
  return mat;
}
function matMul(A, B) {
  const R = Array.from({ length: N }, () => new Float32Array(N));
  for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
    if (!A[i][k]) continue;
    for (let j = 0; j < N; j++) R[i][j] += A[i][k] * B[k][j];
  }
  return R;
}
const ADJ = buildAdjMatrix();
const ADJ2 = matMul(ADJ, ADJ);

function analyzeRegimen(drugIds, age, kidneyDisease, liverDisease) {
  const indices = drugIds.map(id => DRUG_INDEX[id]).filter(i => i !== undefined);
  const flaggedPairs = [], flaggedTriples = [];
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      const i = indices[a], j = indices[b], sev = ADJ[i][j];
      if (sev > 0) {
        let s = sev;
        const dids = [DRUGS[i].id, DRUGS[j].id];
        if (kidneyDisease && dids.some(d => ["lisinopril","losartan","valsartan","metformin","lithium","methotrexate","cyclosporine","tacrolimus","vancomycin","tenofovir"].includes(d))) s = Math.min(1, s + 0.12);
        if (liverDisease && dids.some(d => ["warfarin","simvastatin","atorvastatin","methotrexate","amiodarone","valproate","carbamazepine","acetaminophen","azathioprine"].includes(d))) s = Math.min(1, s + 0.12);
        if (age >= 65) s = Math.min(1, s + 0.08);
        const desc = INTERACTIONS.find(([x, y]) => (x === DRUGS[i].id && y === DRUGS[j].id) || (x === DRUGS[j].id && y === DRUGS[i].id))?.[3] || "Known interaction";
        flaggedPairs.push({ drugs: [DRUGS[i], DRUGS[j]], severity: s, description: desc });
      }
    }
  }
  for (let a = 0; a < indices.length; a++) for (let b = a + 1; b < indices.length; b++) for (let c = b + 1; c < indices.length; c++) {
    const i = indices[a], j = indices[b], k = indices[c];
    const interference = (ADJ2[i][j] * ADJ[j][k] + ADJ2[i][k] * ADJ[k][j] + ADJ2[j][k] * ADJ[k][i]) / 3;
    const directSum = ADJ[i][j] + ADJ[j][k] + ADJ[i][k];
    if (interference > 0.25 && directSum < 1.0) {
      flaggedTriples.push({ drugs: [DRUGS[i], DRUGS[j], DRUGS[k]], severity: Math.min(1, interference * 0.85), description: "Shared metabolic pathway amplification — CYP enzyme, renal clearance, or neurotransmitter cascade overlap", isHidden: true });
    }
  }
  const all = [...flaggedPairs, ...flaggedTriples];
  let score = 0;
  if (all.length) score = Math.min(1, all.reduce((s, f) => s + f.severity, 0) / all.length + all.length * 0.025);
  const questions = [];
  if (flaggedPairs.some(f => f.drugs.some(d => d.id === "warfarin"))) questions.push("Are my INR levels being monitored frequently enough given my full medication list?");
  if (flaggedPairs.some(f => f.drugs.some(d => d.id === "lithium"))) questions.push("Should we check my lithium serum levels given my other medications?");
  if (flaggedPairs.some(f => f.drugs.some(d => ["fluoxetine","sertraline","venlafaxine","duloxetine"].includes(d.id)) && f.drugs.some(d => ["tramadol","linezolid","amitriptyline","nortriptyline"].includes(d.id)))) questions.push("Is there a risk of serotonin syndrome with my antidepressant combination?");
  if (flaggedPairs.some(f => f.drugs.some(d => ["oxycodone","morphine","hydrocodone","fentanyl"].includes(d.id)) && f.drugs.some(d => ["diazepam","lorazepam","clonazepam","alprazolam"].includes(d.id)))) questions.push("Is it safe to combine an opioid and benzodiazepine — are there safer alternatives?");
  if (flaggedPairs.some(f => f.drugs.some(d => ["simvastatin","atorvastatin","rosuvastatin"].includes(d.id)))) questions.push("Should I be on a different statin given the interaction risks with my other medications?");
  if (kidneyDisease) questions.push("Which of my medications need dose adjustment for kidney disease?");
  if (liverDisease) questions.push("Which of my medications are processed by the liver, and should any be reduced?");
  if (age >= 65) questions.push("Which medications on my list carry the highest fall or cognitive risk at my age?");
  if (flaggedTriples.length > 0) questions.push("Could any of my drugs interact through shared liver enzymes (CYP3A4, CYP2C9) in ways standard checks might miss?");
  questions.push("Would you recommend a full pharmacist medication review for my complete drug list?");
  return { score, flaggedPairs: flaggedPairs.sort((a, b) => b.severity - a.severity), flaggedTriples: flaggedTriples.sort((a, b) => b.severity - a.severity), questions };
}

function DrugGraph({ drugs, flaggedPairs, flaggedTriples }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!drugs.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.34;
    const nodes = drugs.map((d, i) => ({ ...d, x: cx + r * Math.cos((2 * Math.PI * i) / drugs.length - Math.PI / 2), y: cy + r * Math.sin((2 * Math.PI * i) / drugs.length - Math.PI / 2) }));
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const allEdges = [
      ...flaggedPairs.map(f => ({ a: f.drugs[0].id, b: f.drugs[1].id, sev: f.severity, hidden: false })),
      ...flaggedTriples.flatMap(t => [{ a: t.drugs[0].id, b: t.drugs[1].id, sev: t.severity, hidden: true }, { a: t.drugs[1].id, b: t.drugs[2].id, sev: t.severity, hidden: true }, { a: t.drugs[0].id, b: t.drugs[2].id, sev: t.severity, hidden: true }]),
    ];
    const involvedIds = new Set(allEdges.flatMap(e => [e.a, e.b]));
    let tick = 0;
    function draw() {
      tick++;
      ctx.clearRect(0, 0, W, H);
      for (const e of allEdges) {
        const na = nodeMap[e.a], nb = nodeMap[e.b];
        if (!na || !nb) continue;
        const p = e.hidden ? 0.5 + 0.5 * Math.sin(tick * 0.04) : 1;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
        if (e.hidden) { ctx.setLineDash([4, 6]); ctx.strokeStyle = `rgba(180,150,255,${0.35 + 0.3 * p})`; ctx.lineWidth = 1.5; }
        else { ctx.setLineDash([]); ctx.strokeStyle = e.sev > 0.75 ? `rgba(248,113,113,${0.7 + 0.2 * p})` : e.sev > 0.5 ? `rgba(251,146,60,${0.7 + 0.2 * p})` : `rgba(250,204,21,${0.7 + 0.2 * p})`; ctx.lineWidth = 1.5 + e.sev * 2.5; }
        ctx.stroke(); ctx.setLineDash([]);
      }
      for (const n of nodes) {
        const inv = involvedIds.has(n.id);
        const pulse = inv ? 1 + 0.12 * Math.sin(tick * 0.06) : 1;
        const nr = 7 * pulse;
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr * 3);
        grd.addColorStop(0, inv ? "rgba(110,200,190,0.65)" : "rgba(80,130,180,0.35)");
        grd.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(n.x, n.y, nr * 3, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = inv ? "#6ec8be" : "#4a8ab0"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = `${drugs.length > 9 ? 9 : 10}px 'DM Sans', sans-serif`;
        ctx.fillStyle = inv ? "#d4f0ec" : "#8ab4c8"; ctx.textAlign = "center";
        const lbl = n.label.length > 13 ? n.label.slice(0, 12) + "…" : n.label;
        ctx.fillText(lbl, n.x, n.y + nr + 14);
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [drugs, flaggedPairs, flaggedTriples]);
  if (!drugs.length) return null;
  return <canvas ref={canvasRef} width={430} height={290} style={{ width: "100%", borderRadius: 10, background: "rgba(5,12,26,0.7)" }} />;
}

function Badge({ v }) {
  const cfg = v > 0.75 ? { c: "#f87171", bg: "rgba(248,113,113,0.1)", lbl: "SEVERE" }
    : v > 0.5 ? { c: "#fb923c", bg: "rgba(251,146,60,0.1)", lbl: "MODERATE" }
    : { c: "#facc15", bg: "rgba(250,204,21,0.1)", lbl: "LOW" };
  return <span style={{ background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.c}55`, borderRadius: 5, padding: "2px 9px", fontSize: 10, fontWeight: 600, letterSpacing: 1, fontFamily: "'DM Mono', monospace" }}>{cfg.lbl} {Math.round(v * 100)}%</span>;
}

const DEMO = ["warfarin", "aspirin", "amiodarone", "simvastatin", "omeprazole", "lisinopril"];

export default function QuantumDose() {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [age, setAge] = useState(58);
  const [kidney, setKidney] = useState(false);
  const [liver, setLiver] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef(null);

  const filtered = DRUGS.filter(d =>
    !selected.find(s => s.id === d.id) &&
    (d.label.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 8);

  const add = d => { setSelected(p => [...p, d]); setSearch(""); setShowDrop(false); };
  const remove = id => setSelected(p => p.filter(d => d.id !== id));

  const loadDemo = () => { setSelected(DRUGS.filter(d => DEMO.includes(d.id))); setAge(69); setKidney(true); setLiver(false); setResult(null); setInsight(""); };
  const reset = () => { setSelected([]); setAge(58); setKidney(false); setLiver(false); setResult(null); setInsight(""); };

  const analyze = () => {
    if (selected.length < 2) return;
    setLoading(true); setResult(null); setInsight("");
    setTimeout(() => { setResult(analyzeRegimen(selected.map(d => d.id), age, kidney, liver)); setLoading(false); }, 500);
  };

  const getInsight = async () => {
    if (!result) return;
    setInsightLoading(true);
    const pairs = result.flaggedPairs.slice(0, 5).map(f => `${f.drugs[0].label} + ${f.drugs[1].label} (${Math.round(f.severity * 100)}%)`).join("; ");
    const triples = result.flaggedTriples.slice(0, 3).map(t => t.drugs.map(d => d.label).join(" → ")).join("; ");
    const prompt = `You are a clinical pharmacology expert. Explain these drug interactions to a patient in warm, clear, plain language.

Patient: Age ${age}, ${kidney ? "chronic kidney disease, " : ""}${liver ? "liver disease, " : ""}taking: ${selected.map(d => d.label).join(", ")}.
Direct interactions: ${pairs || "none"}.
Hidden multi-drug pathway patterns: ${triples || "none"}.
Overall risk score: ${Math.round(result.score * 100)}%.

Write exactly 3 short paragraphs (no headers, no bullet points):
1. What the most important direct interaction means in practical terms.
2. Why hidden multi-drug patterns can be more dangerous than standard two-drug checks.
3. The single most important action this patient should take before their next appointment.

Under 170 words total. Warm, clear tone. Not alarmist. Frame as educational, not medical advice.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setInsight(data.content?.map(c => c.text || "").join("\n") || "Unable to generate insight.");
    } catch { setInsight("Insight unavailable at this time."); }
    setInsightLoading(false);
  };

  const riskCfg = !result ? null
    : result.score > 0.65 ? { color: "#f87171", label: "HIGH RISK", glow: "rgba(248,113,113,0.15)" }
    : result.score > 0.4 ? { color: "#fb923c", label: "MODERATE RISK", glow: "rgba(251,146,60,0.12)" }
    : result.score > 0.1 ? { color: "#facc15", label: "LOW RISK", glow: "rgba(250,204,21,0.1)" }
    : { color: "#4ade80", label: "MINIMAL RISK", glow: "rgba(74,222,128,0.1)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #04090f 0%, #060e1c 25%, #081628 50%, #0a1a2e 75%, #060c18 100%)", color: "#d4e8f0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&family=Cormorant+Garamond:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(110,200,190,0.15);border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(110,200,190,0.4)}60%{box-shadow:0 0 0 7px rgba(110,200,190,0)}}
        .fade-up{animation:fadeUp 0.3s ease forwards}
        .card{background:rgba(255,255,255,0.025);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.065);border-radius:14px}
        .btn-ghost{background:transparent;transition:all .2s;cursor:pointer}
        .btn-ghost:hover{background:rgba(110,200,190,0.08)!important;border-color:rgba(110,200,190,0.35)!important}
        .drop-row:hover{background:rgba(110,200,190,0.07)!important}
        input::placeholder{color:rgba(180,210,225,0.28)}
        .tag-remove{opacity:0.4;transition:opacity .15s}
        .tag:hover .tag-remove{opacity:0.9}
        .analyze-btn{transition:all .2s}
        .analyze-btn:not(:disabled):hover{background:rgba(110,200,190,0.12)!important;border-color:rgba(110,200,190,0.5)!important;color:#8addd6!important}
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "30px 40px 24px", borderBottom: "1px solid rgba(255,255,255,0.055)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6ec8be", animation: "pulse 2.8s ease infinite" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3.5, color: "rgba(110,200,190,0.65)", fontWeight: 400 }}>INTERACTION ANALYSIS SYSTEM</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 46, fontWeight: 700, color: "#eaf5f8", letterSpacing: 0, lineHeight: 1, display: "flex", alignItems: "baseline", gap: 2 }}>
            Quantum<span style={{ color: "#6ec8be" }}>Dose</span>
          </h1>
          <p style={{ marginTop: 7, fontSize: 13, color: "rgba(180,210,225,0.42)", fontWeight: 300, letterSpacing: 0.2 }}>Multi-drug interaction detection — beyond standard pairwise checks</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadDemo} className="btn-ghost" style={{ border: "1px solid rgba(110,200,190,0.22)", color: "rgba(110,200,190,0.75)", padding: "8px 20px", fontSize: 11, fontFamily: "'DM Mono', monospace", borderRadius: 8, letterSpacing: 1.2 }}>LOAD DEMO</button>
          <button onClick={reset} className="btn-ghost" style={{ border: "1px solid rgba(255,255,255,0.09)", color: "rgba(180,210,225,0.38)", padding: "8px 20px", fontSize: 11, fontFamily: "'DM Mono', monospace", borderRadius: 8, letterSpacing: 1.2 }}>RESET</button>
        </div>
      </header>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "26px 32px 60px", display: "grid", gridTemplateColumns: "310px 1fr", gap: 22, alignItems: "start" }}>

        {/* LEFT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Patient Profile */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(110,200,190,0.5)", marginBottom: 18, fontWeight: 500 }}>PATIENT PROFILE</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(200,225,232,0.6)", fontWeight: 400 }}>Age</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#eaf5f8", fontWeight: 700, lineHeight: 1 }}>{age}</span>
            </div>
            <input type="range" min={18} max={95} value={age} onChange={e => setAge(+e.target.value)} style={{ width: "100%", accentColor: "#6ec8be", cursor: "pointer", marginBottom: 4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(180,210,225,0.22)", fontFamily: "'DM Mono', monospace", marginBottom: 18 }}><span>18</span><span>95</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              {[[kidney, setKidney, "Kidney Disease"], [liver, setLiver, "Liver Disease"]].map(([val, set, lbl], i) => (
                <button key={i} onClick={() => set(!val)} className="btn-ghost" style={{ flex: 1, padding: "9px 6px", fontSize: 11, fontWeight: 500, border: `1px solid ${val ? "rgba(110,200,190,0.4)" : "rgba(255,255,255,0.08)"}`, background: val ? "rgba(110,200,190,0.08)" : "transparent", color: val ? "#6ec8be" : "rgba(180,210,225,0.38)", borderRadius: 8 }}>
                  {val ? "✓ " : ""}{lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Drug Search */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(110,200,190,0.5)", marginBottom: 16, fontWeight: 500 }}>
              MEDICATIONS {selected.length > 0 && <span style={{ color: "#6ec8be" }}>({selected.length} added)</span>}
            </div>
            <div style={{ position: "relative" }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setShowDrop(false); }} ref={dropRef}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                placeholder="Search medication or drug class…"
                style={{ width: "100%", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: "10px 14px", color: "#d4e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
              />
              {showDrop && search && filtered.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, background: "#070f1e", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, zIndex: 30, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
                  {filtered.map(d => (
                    <button key={d.id} className="drop-row" tabIndex={0} onMouseDown={() => add(d)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#d4e8f0", fontSize: 13, cursor: "pointer", transition: "background .15s" }}>
                      {d.label}
                      <span style={{ marginLeft: 9, fontSize: 10, color: "rgba(180,210,225,0.3)", fontFamily: "'DM Mono', monospace" }}>{d.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selected.length > 0 ? (
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.map(d => (
                  <span key={d.id} className="tag" style={{ background: "rgba(110,200,190,0.07)", border: "1px solid rgba(110,200,190,0.18)", borderRadius: 7, padding: "5px 9px 5px 11px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "#b8e0da", animation: "fadeUp .18s ease" }}>
                    {d.label}
                    <button onClick={() => remove(d.id)} className="tag-remove" style={{ background: "none", border: "none", color: "#6ec8be", fontSize: 16, padding: 0, lineHeight: 1, cursor: "pointer" }}>×</button>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ marginTop: 12, fontSize: 11, color: "rgba(180,210,225,0.22)", fontFamily: "'DM Mono', monospace", fontStyle: "italic" }}>Add at least 2 medications to analyze</p>
            )}
          </div>

          <button onClick={analyze} disabled={selected.length < 2 || loading} className="analyze-btn"
            style={{ width: "100%", padding: "13px", background: "rgba(110,200,190,0.07)", color: selected.length >= 2 ? "rgba(110,200,190,0.85)" : "rgba(110,200,190,0.2)", fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 12, letterSpacing: 2.5, border: `1px solid ${selected.length >= 2 ? "rgba(110,200,190,0.25)" : "rgba(110,200,190,0.08)"}`, borderRadius: 10, cursor: selected.length >= 2 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(110,200,190,0.25)", borderTopColor: "#6ec8be", borderRadius: "50%", animation: "spin .7s linear infinite" }} />ANALYZING…</> : "RUN ANALYSIS →"}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {!result && !loading && (
            <div className="card" style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 50, opacity: 0.08, marginBottom: 18, fontFamily: "serif" }}>◈</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 3, color: "rgba(180,210,225,0.2)" }}>ADD MEDICATIONS AND RUN ANALYSIS</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(180,210,225,0.12)", fontWeight: 300 }}>Pairwise + quantum-path hidden pattern detection</div>
            </div>
          )}

          {result && riskCfg && (
            <>
              {/* Risk Banner */}
              <div className="card fade-up" style={{ padding: "22px 28px", borderColor: `${riskCfg.color}28`, background: riskCfg.glow, display: "flex", alignItems: "center", gap: 26 }}>
                <div style={{ position: "relative", width: 82, height: 82, flexShrink: 0 }}>
                  <svg width="82" height="82" viewBox="0 0 82 82">
                    <circle cx="41" cy="41" r="33" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle cx="41" cy="41" r="33" fill="none" stroke={riskCfg.color} strokeWidth="6"
                      strokeDasharray={`${result.score * 207.3} 207.3`} strokeLinecap="round"
                      transform="rotate(-90 41 41)" style={{ transition: "stroke-dasharray 1.1s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: riskCfg.color, lineHeight: 1 }}>{Math.round(result.score * 100)}</span>
                    <span style={{ fontSize: 8, color: riskCfg.color, opacity: 0.6, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(180,210,225,0.35)", marginBottom: 7 }}>OVERALL REGIMEN RISK</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: riskCfg.color, lineHeight: 1 }}>{riskCfg.label}</div>
                  <div style={{ marginTop: 9, fontSize: 12, color: "rgba(180,210,225,0.4)", display: "flex", gap: 18 }}>
                    <span><span style={{ color: "#f87171", marginRight: 5 }}>●</span>{result.flaggedPairs.length} direct {result.flaggedPairs.length === 1 ? "interaction" : "interactions"}</span>
                    <span><span style={{ color: "#b496ff", marginRight: 5 }}>●</span>{result.flaggedTriples.length} hidden {result.flaggedTriples.length === 1 ? "pathway" : "pathways"}</span>
                  </div>
                </div>
              </div>

              {/* Graph + Interactions Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {/* Graph */}
                <div className="card fade-up" style={{ padding: 18 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(110,200,190,0.45)", marginBottom: 12 }}>INTERACTION MAP</div>
                  <DrugGraph drugs={selected} flaggedPairs={result.flaggedPairs} flaggedTriples={result.flaggedTriples} />
                  <div style={{ marginTop: 10, display: "flex", gap: 18, fontSize: 10, color: "rgba(180,210,225,0.3)", fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 2.5, background: "#f87171", display: "inline-block", borderRadius: 2 }} />Direct</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 2, borderTop: "2px dashed rgba(180,150,255,0.6)", display: "inline-block" }} />Hidden</span>
                  </div>
                </div>

                {/* Flags */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {result.flaggedPairs.length > 0 && (
                    <div className="card fade-up" style={{ padding: 18, flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(248,113,113,0.5)", marginBottom: 14 }}>DIRECT INTERACTIONS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 210, overflowY: "auto" }}>
                        {result.flaggedPairs.map((f, i) => (
                          <div key={i} style={{ borderLeft: `3px solid ${f.severity > 0.75 ? "#f87171" : f.severity > 0.5 ? "#fb923c" : "#facc15"}22`, paddingLeft: 12, borderLeftColor: f.severity > 0.75 ? "#f87171" : f.severity > 0.5 ? "#fb923c" : "#facc15" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, flexWrap: "wrap", gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#d4e8f0" }}>{f.drugs[0].label} + {f.drugs[1].label}</span>
                              <Badge v={f.severity} />
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(180,210,225,0.45)", lineHeight: 1.6 }}>{f.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.flaggedTriples.length > 0 && (
                    <div className="card fade-up" style={{ padding: 18, background: "rgba(140,100,255,0.04)", borderColor: "rgba(140,100,255,0.12)" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(180,150,255,0.65)", marginBottom: 14 }}>⚡ HIDDEN PATHWAYS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                        {result.flaggedTriples.map((t, i) => (
                          <div key={i} style={{ borderLeft: "3px solid rgba(160,120,255,0.5)", paddingLeft: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, flexWrap: "wrap", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 500, color: "#c4a8ff" }}>{t.drugs.map(d => d.label).join(" → ")}</span>
                              <Badge v={t.severity} />
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(180,210,225,0.38)", lineHeight: 1.6 }}>{t.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.flaggedPairs.length === 0 && result.flaggedTriples.length === 0 && (
                    <div className="card" style={{ padding: 28, textAlign: "center" }}>
                      <div style={{ fontSize: 28, color: "#4ade80", marginBottom: 10 }}>✓</div>
                      <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 500 }}>No significant interactions found</div>
                      <div style={{ fontSize: 11, color: "rgba(180,210,225,0.28)", marginTop: 6 }}>Always confirm with your pharmacist</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Questions */}
              {result.questions.length > 0 && (
                <div className="card fade-up" style={{ padding: 22 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(110,200,190,0.45)", marginBottom: 16 }}>QUESTIONS TO ASK YOUR DOCTOR</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {result.questions.map((q, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 9, padding: "12px 14px", fontSize: 12.5, color: "rgba(200,228,235,0.68)", lineHeight: 1.7, display: "flex", gap: 10 }}>
                        <span style={{ color: "rgba(110,200,190,0.6)", flexShrink: 0 }}>›</span>{q}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pharmacology Insight */}
              <div className="card fade-up" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: insight ? 16 : 0, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: 3, color: "rgba(110,200,190,0.45)" }}>PHARMACOLOGY INSIGHT</div>
                  <button onClick={getInsight} disabled={insightLoading} className="btn-ghost"
                    style={{ background: "rgba(110,200,190,0.07)", border: "1px solid rgba(110,200,190,0.22)", color: "rgba(110,200,190,0.7)", padding: "8px 18px", fontSize: 10.5, fontFamily: "'DM Mono', monospace", borderRadius: 8, letterSpacing: 1.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    {insightLoading ? <><span style={{ width: 11, height: 11, border: "1.5px solid rgba(110,200,190,0.25)", borderTopColor: "#6ec8be", borderRadius: "50%", animation: "spin .7s linear infinite" }} />GENERATING…</> : "GENERATE INSIGHT"}
                  </button>
                </div>
                {insight ? (
                  <div style={{ fontSize: 13.5, color: "rgba(210,235,240,0.75)", lineHeight: 1.9, whiteSpace: "pre-wrap", borderTop: "1px solid rgba(255,255,255,0.055)", paddingTop: 16, fontWeight: 300, fontStyle: "italic", letterSpacing: 0.1 }}>{insight}</div>
                ) : !insightLoading && (
                  <p style={{ marginTop: 12, fontSize: 12, color: "rgba(180,210,225,0.22)", fontStyle: "italic" }}>Generate a plain-language explanation of your interaction patterns.</p>
                )}
              </div>

              {/* Disclaimer */}
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(180,210,225,0.18)", fontFamily: "'DM Mono', monospace", letterSpacing: 0.4, lineHeight: 1.9 }}>
                FOR EDUCATIONAL PURPOSES ONLY — NOT MEDICAL ADVICE<br />
                Always consult your physician or pharmacist before changing any medication.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
