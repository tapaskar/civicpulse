/**
 * District Magistrate / Collector / Deputy Commissioner contact lookup.
 *
 * Strategy:
 *  1. Reverse-geocode lat/lng → district + state via Nominatim
 *  2. Check VERIFIED_DISTRICTS for curated email/phone
 *  3. Fall back to generated website URL + CPGRAMS + 1077 helpline
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface DistrictAuthority {
  title: string;      // "District Magistrate" | "District Collector" | "Deputy Commissioner"
  district: string;
  state: string;
  email?: string;
  phone?: string;
  website?: string;
  cpgrams: string;    // Always present
  helpline: string;   // 1077 — District disaster / admin helpline
}

interface StateConfig {
  title: 'District Magistrate' | 'District Collector' | 'Deputy Commissioner';
}

// ─── State configuration ─────────────────────────────────────────────

const STATE_CONFIG: Record<string, StateConfig> = {
  // District Magistrate states
  'uttar pradesh':   { title: 'District Magistrate' },
  'bihar':           { title: 'District Magistrate' },
  'madhya pradesh':  { title: 'District Magistrate' },
  'rajasthan':       { title: 'District Magistrate' },
  'west bengal':     { title: 'District Magistrate' },
  'uttarakhand':     { title: 'District Magistrate' },
  'tripura':         { title: 'District Magistrate' },

  // District Collector states
  'tamil nadu':      { title: 'District Collector' },
  'kerala':          { title: 'District Collector' },
  'andhra pradesh':  { title: 'District Collector' },
  'telangana':       { title: 'District Collector' },
  'maharashtra':     { title: 'District Collector' },
  'goa':             { title: 'District Collector' },
  'gujarat':         { title: 'District Collector' },
  'odisha':          { title: 'District Collector' },
  'sikkim':          { title: 'District Collector' },
  'puducherry':      { title: 'District Collector' },

  // Deputy Commissioner states
  'karnataka':       { title: 'Deputy Commissioner' },
  'punjab':          { title: 'Deputy Commissioner' },
  'haryana':         { title: 'Deputy Commissioner' },
  'himachal pradesh':{ title: 'Deputy Commissioner' },
  'jharkhand':       { title: 'Deputy Commissioner' },
  'chhattisgarh':    { title: 'Deputy Commissioner' },
  'assam':           { title: 'Deputy Commissioner' },
  'meghalaya':       { title: 'Deputy Commissioner' },
  'mizoram':         { title: 'Deputy Commissioner' },
  'nagaland':        { title: 'Deputy Commissioner' },
  'arunachal pradesh':{ title: 'Deputy Commissioner' },
  'manipur':         { title: 'Deputy Commissioner' },
  'jammu and kashmir':{ title: 'Deputy Commissioner' },
  'ladakh':          { title: 'Deputy Commissioner' },
  'delhi':           { title: 'Deputy Commissioner' },
};

// ─── Verified district contacts ──────────────────────────────────────
// Key: "district_lowercase|state_lowercase"

interface VerifiedContact {
  email?: string;
  phone?: string;
  website?: string;
}

const VERIFIED_DISTRICTS: Record<string, VerifiedContact> = {
  // ── Uttar Pradesh ──
  'lucknow|uttar pradesh':        { email: 'dmluc@nic.in', phone: '0522-2623024', website: 'https://lucknow.nic.in' },
  'varanasi|uttar pradesh':       { email: 'dmvar@nic.in', phone: '0542-2502626', website: 'https://varanasi.nic.in' },
  'kanpur nagar|uttar pradesh':   { email: 'dmkap@nic.in', phone: '9454417554', website: 'https://kanpurnagar.nic.in' },
  'kanpur|uttar pradesh':         { email: 'dmkap@nic.in', phone: '9454417554', website: 'https://kanpurnagar.nic.in' },
  'agra|uttar pradesh':           { email: 'dmagr@nic.in', website: 'https://agra.nic.in' },
  'prayagraj|uttar pradesh':      { email: 'dmald@nic.in', website: 'https://prayagraj.nic.in' },
  'allahabad|uttar pradesh':      { email: 'dmald@nic.in', website: 'https://prayagraj.nic.in' },
  'gorakhpur|uttar pradesh':      { email: 'dmgor@nic.in', website: 'https://gorakhpur.nic.in' },
  'meerut|uttar pradesh':         { email: 'dmmee@nic.in', website: 'https://meerut.nic.in' },
  'ghaziabad|uttar pradesh':      { email: 'dmgbd@nic.in', website: 'https://ghaziabad.nic.in' },
  'noida|uttar pradesh':          { email: 'dmgbn@nic.in', website: 'https://gautambudhnagar.nic.in' },
  'gautam buddha nagar|uttar pradesh': { email: 'dmgbn@nic.in', website: 'https://gautambudhnagar.nic.in' },
  'bareilly|uttar pradesh':       { email: 'dmbar@nic.in', website: 'https://bareilly.nic.in' },
  'aligarh|uttar pradesh':        { email: 'dmalg@nic.in', website: 'https://aligarh.nic.in' },
  'moradabad|uttar pradesh':      { email: 'dmmbd@nic.in', website: 'https://moradabad.nic.in' },
  'saharanpur|uttar pradesh':     { email: 'dmsrp@nic.in', website: 'https://saharanpur.nic.in' },
  'jhansi|uttar pradesh':         { email: 'dmjha@nic.in', website: 'https://jhansi.nic.in' },
  'mathura|uttar pradesh':        { email: 'dmmat@nic.in', website: 'https://mathura.nic.in' },
  'firozabad|uttar pradesh':      { email: 'dmfir@nic.in', website: 'https://firozabad.nic.in' },
  'ayodhya|uttar pradesh':        { email: 'dmfzb@nic.in', website: 'https://ayodhya.nic.in' },

  // ── Bihar ──
  'patna|bihar':                  { email: 'dm-patna.bih@nic.in', phone: '0612-2219545', website: 'https://patna.nic.in' },
  'gaya|bihar':                   { email: 'dm-gaya.bih@nic.in', phone: '0631-2222900', website: 'https://gaya.nic.in' },
  'muzaffarpur|bihar':            { email: 'dm-muzaffarpur.bih@nic.in', website: 'https://muzaffarpur.nic.in' },
  'bhagalpur|bihar':              { email: 'dm-bhagalpur.bih@nic.in', website: 'https://bhagalpur.nic.in' },
  'purnia|bihar':                 { email: 'dm-purnia.bih@nic.in', website: 'https://purnia.nic.in' },
  'darbhanga|bihar':              { email: 'dm-darbhanga.bih@nic.in', website: 'https://darbhanga.nic.in' },
  'begusarai|bihar':              { email: 'dm-begusarai.bih@nic.in', website: 'https://begusarai.nic.in' },
  'nalanda|bihar':                { email: 'dm-nalanda.bih@nic.in', website: 'https://nalanda.nic.in' },

  // ── Rajasthan ──
  'jaipur|rajasthan':             { email: 'dm-jaip-rj@nic.in', phone: '0141-2209000', website: 'https://jaipur.rajasthan.gov.in' },
  'jodhpur|rajasthan':            { email: 'dm-jod-rj@nic.in', phone: '0291-2650322', website: 'https://jodhpur.rajasthan.gov.in' },
  'udaipur|rajasthan':            { email: 'dm-uda-rj@nic.in', phone: '0294-2410834', website: 'https://udaipur.rajasthan.gov.in' },
  'kota|rajasthan':               { email: 'dm-kot-rj@nic.in', website: 'https://kota.rajasthan.gov.in' },
  'ajmer|rajasthan':              { email: 'dm-ajm-rj@nic.in', website: 'https://ajmer.rajasthan.gov.in' },
  'bikaner|rajasthan':            { email: 'dm-bik-rj@nic.in', website: 'https://bikaner.rajasthan.gov.in' },
  'alwar|rajasthan':              { email: 'dm-alw-rj@nic.in', website: 'https://alwar.rajasthan.gov.in' },
  'sikar|rajasthan':              { email: 'dm-sik-rj@nic.in', website: 'https://sikar.rajasthan.gov.in' },
  'bhilwara|rajasthan':           { email: 'dm-bhi-rj@nic.in', website: 'https://bhilwara.rajasthan.gov.in' },

  // ── Madhya Pradesh ──
  'bhopal|madhya pradesh':        { email: 'dmbhopal@nic.in', phone: '0755-2540494', website: 'https://bhopal.nic.in' },
  'indore|madhya pradesh':        { email: 'dmindore@nic.in', phone: '0731-2449111', website: 'https://indore.nic.in' },
  'jabalpur|madhya pradesh':      { email: 'dmjabalpur@nic.in', website: 'https://jabalpur.nic.in' },
  'gwalior|madhya pradesh':       { email: 'dmgwalior@nic.in', website: 'https://gwalior.nic.in' },
  'ujjain|madhya pradesh':        { email: 'dmujjain@nic.in', website: 'https://ujjain.nic.in' },
  'sagar|madhya pradesh':         { email: 'dmsagar@nic.in', website: 'https://sagar.nic.in' },
  'rewa|madhya pradesh':          { email: 'dmrewa@nic.in', website: 'https://rewa.nic.in' },

  // ── Gujarat ──
  'ahmedabad|gujarat':            { email: 'collector-ahd@gujarat.gov.in', phone: '079-27551681', website: 'https://ahmedabad.gujarat.gov.in' },
  'surat|gujarat':                { email: 'collector-sur@gujarat.gov.in', phone: '0261-2655151', website: 'https://surat.gujarat.gov.in' },
  'vadodara|gujarat':             { email: 'collector-vad@gujarat.gov.in', website: 'https://vadodara.gujarat.gov.in' },
  'rajkot|gujarat':               { email: 'collector-raj@gujarat.gov.in', website: 'https://rajkot.gujarat.gov.in' },
  'bhavnagar|gujarat':            { email: 'collector-bhv@gujarat.gov.in', website: 'https://bhavnagar.gujarat.gov.in' },
  'jamnagar|gujarat':             { email: 'collector-jam@gujarat.gov.in', website: 'https://jamnagar.gujarat.gov.in' },
  'junagadh|gujarat':             { email: 'collector-jun@gujarat.gov.in', website: 'https://junagadh.gujarat.gov.in' },
  'gandhinagar|gujarat':          { email: 'collector-gnr@gujarat.gov.in', website: 'https://gandhinagar.gujarat.gov.in' },

  // ── Maharashtra ──
  'pune|maharashtra':             { email: 'collector.pune@maharashtra.gov.in', website: 'https://pune.gov.in' },
  'mumbai|maharashtra':           { website: 'https://mumbai.gov.in' },
  'mumbai suburban|maharashtra':  { website: 'https://mumbaisuburban.gov.in' },
  'nagpur|maharashtra':           { email: 'collector.nagpur@maharashtra.gov.in', website: 'https://nagpur.gov.in' },
  'thane|maharashtra':            { email: 'collector.thane@maharashtra.gov.in', website: 'https://thane.gov.in' },
  'nashik|maharashtra':           { email: 'collector.nashik@maharashtra.gov.in', website: 'https://nashik.gov.in' },
  'aurangabad|maharashtra':       { email: 'collector.aurangabad@maharashtra.gov.in', website: 'https://aurangabad.gov.in' },
  'solapur|maharashtra':          { email: 'collector.solapur@maharashtra.gov.in', website: 'https://solapur.gov.in' },
  'kolhapur|maharashtra':         { email: 'collector.kolhapur@maharashtra.gov.in', website: 'https://kolhapur.gov.in' },
  'satara|maharashtra':           { email: 'collector.satara@maharashtra.gov.in', website: 'https://satara.gov.in' },
  'sangli|maharashtra':           { email: 'collector.sangli@maharashtra.gov.in', website: 'https://sangli.gov.in' },
  'ratnagiri|maharashtra':        { email: 'collector.ratnagiri@maharashtra.gov.in', website: 'https://ratnagiri.gov.in' },

  // ── Tamil Nadu ──
  'chennai|tamil nadu':           { email: 'collrchn@nic.in', website: 'https://chennai.nic.in' },
  'coimbatore|tamil nadu':        { email: 'collrcbe@nic.in', phone: '0422-2301114', website: 'https://coimbatore.nic.in' },
  'madurai|tamil nadu':           { email: 'collrmdu@nic.in', phone: '0452-2531110', website: 'https://madurai.nic.in' },
  'tiruchirappalli|tamil nadu':   { email: 'collrtry@nic.in', website: 'https://tiruchirappalli.nic.in' },
  'tirunelveli|tamil nadu':       { email: 'collrtvl@nic.in', website: 'https://tirunelveli.nic.in' },
  'salem|tamil nadu':             { email: 'collrslm@nic.in', website: 'https://salem.nic.in' },
  'erode|tamil nadu':             { email: 'collrerd@nic.in', website: 'https://erode.nic.in' },
  'vellore|tamil nadu':           { email: 'collrvlr@nic.in', website: 'https://vellore.nic.in' },
  'thanjavur|tamil nadu':         { email: 'collrtnj@nic.in', website: 'https://thanjavur.nic.in' },
  'kancheepuram|tamil nadu':      { email: 'collrkpm@nic.in', website: 'https://kancheepuram.nic.in' },
  'cuddalore|tamil nadu':         { email: 'collrcdl@nic.in', website: 'https://cuddalore.nic.in' },
  'dindigul|tamil nadu':          { email: 'collrdgl@nic.in', website: 'https://dindigul.nic.in' },

  // ── Kerala ──
  'thiruvananthapuram|kerala':    { email: 'dctvm.ker@nic.in', phone: '0471-2731177', website: 'https://trivandrum.nic.in' },
  'ernakulam|kerala':             { email: 'dcekm.ker@nic.in', phone: '0484-2423001', website: 'https://ernakulam.nic.in' },
  'kozhikode|kerala':             { email: 'dckzd.ker@nic.in', website: 'https://kozhikode.nic.in' },
  'thrissur|kerala':              { email: 'dctsr.ker@nic.in', website: 'https://thrissur.nic.in' },
  'kollam|kerala':                { email: 'dcklm.ker@nic.in', website: 'https://kollam.nic.in' },
  'palakkad|kerala':              { email: 'dcpkd.ker@nic.in', website: 'https://palakkad.nic.in' },
  'kannur|kerala':                { email: 'dcknr.ker@nic.in', website: 'https://kannur.nic.in' },
  'malappuram|kerala':            { email: 'dcmlp.ker@nic.in', website: 'https://malappuram.nic.in' },
  'alappuzha|kerala':             { email: 'dcalp.ker@nic.in', website: 'https://alappuzha.nic.in' },
  'kottayam|kerala':              { email: 'dcktm.ker@nic.in', website: 'https://kottayam.nic.in' },
  'idukki|kerala':                { email: 'dcidk.ker@nic.in', website: 'https://idukki.nic.in' },
  'pathanamthitta|kerala':        { email: 'dcpta.ker@nic.in', website: 'https://pathanamthitta.nic.in' },
  'wayanad|kerala':               { email: 'dcwyd.ker@nic.in', website: 'https://wayanad.nic.in' },
  'kasaragod|kerala':             { email: 'dcksd.ker@nic.in', website: 'https://kasaragod.nic.in' },

  // ── Karnataka ──
  'bengaluru urban|karnataka':    { email: 'dcbng-ka@nic.in', phone: '080-22212314', website: 'https://bangaloreurban.nic.in' },
  'bangalore urban|karnataka':    { email: 'dcbng-ka@nic.in', phone: '080-22212314', website: 'https://bangaloreurban.nic.in' },
  'mysuru|karnataka':             { email: 'dcmys-ka@nic.in', phone: '0821-2423800', website: 'https://mysore.nic.in' },
  'mysore|karnataka':             { email: 'dcmys-ka@nic.in', phone: '0821-2423800', website: 'https://mysore.nic.in' },
  'dakshina kannada|karnataka':   { email: 'dcmnglr-ka@nic.in', phone: '0824-2220588', website: 'https://dk.nic.in' },
  'mangalore|karnataka':          { email: 'dcmnglr-ka@nic.in', phone: '0824-2220588', website: 'https://dk.nic.in' },
  'belgaum|karnataka':            { email: 'dcbgm-ka@nic.in', website: 'https://belagavi.nic.in' },
  'belagavi|karnataka':           { email: 'dcbgm-ka@nic.in', website: 'https://belagavi.nic.in' },
  'hubli-dharwad|karnataka':      { email: 'dcdwd-ka@nic.in', website: 'https://dharwad.nic.in' },
  'dharwad|karnataka':            { email: 'dcdwd-ka@nic.in', website: 'https://dharwad.nic.in' },
  'tumkur|karnataka':             { email: 'dctmk-ka@nic.in', website: 'https://tumkur.nic.in' },
  'shimoga|karnataka':            { email: 'dcsmg-ka@nic.in', website: 'https://shimoga.nic.in' },
  'gulbarga|karnataka':           { email: 'dcglb-ka@nic.in', website: 'https://kalaburagi.nic.in' },
  'kalaburagi|karnataka':         { email: 'dcglb-ka@nic.in', website: 'https://kalaburagi.nic.in' },
  'bellary|karnataka':            { email: 'dcbly-ka@nic.in', website: 'https://ballari.nic.in' },
  'udupi|karnataka':              { email: 'dcupi-ka@nic.in', website: 'https://udupi.nic.in' },
  'hassan|karnataka':             { email: 'dchas-ka@nic.in', website: 'https://hassan.nic.in' },
  'raichur|karnataka':            { email: 'dcrcr-ka@nic.in', website: 'https://raichur.nic.in' },
  'mandya|karnataka':             { email: 'dcmdy-ka@nic.in', website: 'https://mandya.nic.in' },
  'kodagu|karnataka':             { email: 'dcmdkr-ka@nic.in', website: 'https://kodagu.nic.in' },

  // ── Telangana ──
  'hyderabad|telangana':          { email: 'collector_hyd@telangana.gov.in', website: 'https://hyderabad.telangana.gov.in' },
  'ranga reddy|telangana':        { email: 'collector_rr@telangana.gov.in', phone: '040-23235642', website: 'https://rangareddy.telangana.gov.in' },
  'rangareddy|telangana':         { email: 'collector_rr@telangana.gov.in', phone: '040-23235642', website: 'https://rangareddy.telangana.gov.in' },
  'warangal|telangana':           { email: 'collector_wgl@telangana.gov.in', phone: '0870-2510777', website: 'https://warangal.telangana.gov.in' },
  'medchal-malkajgiri|telangana': { email: 'collector_mm@telangana.gov.in', website: 'https://medchalmalkajgiri.telangana.gov.in' },
  'karimnagar|telangana':         { email: 'collector_knr@telangana.gov.in', website: 'https://karimnagar.telangana.gov.in' },
  'khammam|telangana':            { email: 'collector_kmm@telangana.gov.in', website: 'https://khammam.telangana.gov.in' },
  'nizamabad|telangana':          { email: 'collector_nzb@telangana.gov.in', website: 'https://nizamabad.telangana.gov.in' },
  'nalgonda|telangana':           { email: 'collector_nlg@telangana.gov.in', website: 'https://nalgonda.telangana.gov.in' },
  'mahbubnagar|telangana':        { email: 'collector_mbnr@telangana.gov.in', website: 'https://mahbubnagar.telangana.gov.in' },

  // ── Andhra Pradesh ──
  'visakhapatnam|andhra pradesh': { email: 'collector_vspm@ap.gov.in', phone: '8331093001', website: 'https://visakhapatnam.ap.gov.in' },
  'guntur|andhra pradesh':        { email: 'collector_gntr@ap.gov.in', phone: '0863-2234200', website: 'https://guntur.ap.gov.in' },
  'krishna|andhra pradesh':       { email: 'collector_krsn@ap.gov.in', website: 'https://krishna.ap.gov.in' },
  'east godavari|andhra pradesh': { email: 'collector_eg@ap.gov.in', website: 'https://eastgodavari.ap.gov.in' },
  'west godavari|andhra pradesh': { email: 'collector_wg@ap.gov.in', website: 'https://westgodavari.ap.gov.in' },
  'kurnool|andhra pradesh':       { email: 'collector_knl@ap.gov.in', website: 'https://kurnool.ap.gov.in' },
  'chittoor|andhra pradesh':      { email: 'collector_cttr@ap.gov.in', website: 'https://chittoor.ap.gov.in' },
  'anantapur|andhra pradesh':     { email: 'collector_atp@ap.gov.in', website: 'https://anantapur.ap.gov.in' },
  'nellore|andhra pradesh':       { email: 'collector_nlr@ap.gov.in', website: 'https://nellore.ap.gov.in' },
  'prakasam|andhra pradesh':      { email: 'collector_pkm@ap.gov.in', website: 'https://prakasam.ap.gov.in' },
  'kadapa|andhra pradesh':        { email: 'collector_kdp@ap.gov.in', website: 'https://kadapa.ap.gov.in' },
  'srikakulam|andhra pradesh':    { email: 'collector_sklm@ap.gov.in', website: 'https://srikakulam.ap.gov.in' },

  // ── Punjab ──
  'ludhiana|punjab':              { email: 'dc.ldh@punjab.gov.in', phone: '0161-2403100', website: 'https://ludhiana.nic.in' },
  'amritsar|punjab':              { email: 'dc.asr@punjab.gov.in', phone: '0183-2223991', website: 'https://amritsar.nic.in' },
  'jalandhar|punjab':             { email: 'dc.jln@punjab.gov.in', website: 'https://jalandhar.nic.in' },
  'patiala|punjab':               { email: 'dc.ptl@punjab.gov.in', website: 'https://patiala.nic.in' },
  'bathinda|punjab':              { email: 'dc.btd@punjab.gov.in', website: 'https://bathinda.nic.in' },
  'mohali|punjab':                { email: 'dc.mhl@punjab.gov.in', website: 'https://sahibzadaajitsinghnagar.nic.in' },
  'sangrur|punjab':               { email: 'dc.sgr@punjab.gov.in', website: 'https://sangrur.nic.in' },
  'firozpur|punjab':              { email: 'dc.fzr@punjab.gov.in', website: 'https://ferozepur.nic.in' },
  'hoshiarpur|punjab':            { email: 'dc.hsp@punjab.gov.in', website: 'https://hoshiarpur.nic.in' },
  'gurdaspur|punjab':             { email: 'dc.gdp@punjab.gov.in', website: 'https://gurdaspur.nic.in' },
  'kapurthala|punjab':            { email: 'dc.kpt@punjab.gov.in', website: 'https://kapurthala.nic.in' },
  'moga|punjab':                  { email: 'dc.mga@punjab.gov.in', website: 'https://moga.nic.in' },

  // ── Haryana ──
  'gurugram|haryana':             { email: 'dcggn@nic.in', phone: '0124-2328800', website: 'https://gurugram.gov.in' },
  'gurgaon|haryana':              { email: 'dcggn@nic.in', phone: '0124-2328800', website: 'https://gurugram.gov.in' },
  'faridabad|haryana':            { email: 'dcfbd@nic.in', website: 'https://faridabad.gov.in' },
  'hisar|haryana':                { email: 'dchsr@nic.in', website: 'https://hisar.gov.in' },
  'panipat|haryana':              { email: 'dcpnp@nic.in', website: 'https://panipat.gov.in' },
  'karnal|haryana':               { email: 'dcknl@nic.in', website: 'https://karnal.gov.in' },
  'ambala|haryana':               { email: 'dcamb@nic.in', website: 'https://ambala.gov.in' },
  'rohtak|haryana':               { email: 'dcrtk@nic.in', website: 'https://rohtak.gov.in' },
  'sonipat|haryana':              { email: 'dcsnp@nic.in', website: 'https://sonipat.gov.in' },
  'panchkula|haryana':            { email: 'dcpkl@nic.in', website: 'https://panchkula.gov.in' },
  'yamunanagar|haryana':          { email: 'dcymn@nic.in', website: 'https://yamunanagar.gov.in' },
  'jhajjar|haryana':              { email: 'dcjjr@nic.in', website: 'https://jhajjar.gov.in' },
  'rewari|haryana':               { email: 'dcrwl@nic.in', website: 'https://rewari.gov.in' },
  'sirsa|haryana':                { email: 'dcsirsa@nic.in', website: 'https://sirsa.gov.in' },
  'bhiwani|haryana':              { email: 'dcbwn@nic.in', website: 'https://bhiwani.gov.in' },
  'jind|haryana':                 { email: 'dcjind@nic.in', website: 'https://jind.gov.in' },
  'kaithal|haryana':              { email: 'dcktl@nic.in', website: 'https://kaithal.gov.in' },
  'kurukshetra|haryana':          { email: 'dckkr@nic.in', website: 'https://kurukshetra.gov.in' },
  'mahendragarh|haryana':         { email: 'dcnrn@nic.in', website: 'https://mahendragarh.gov.in' },
  'nuh|haryana':                  { email: 'dcnuh@nic.in', website: 'https://nuh.gov.in' },
  'palwal|haryana':               { email: 'dcpwl@nic.in', website: 'https://palwal.gov.in' },
  'charki dadri|haryana':         { email: 'dcchd@nic.in', website: 'https://charkidadri.gov.in' },

  // ── Jharkhand ──
  'ranchi|jharkhand':             { email: 'dc-ran@nic.in', phone: '0651-2214001', website: 'https://ranchi.nic.in' },
  'dhanbad|jharkhand':            { email: 'dc-dhn@nic.in', website: 'https://dhanbad.nic.in' },
  'jamshedpur|jharkhand':         { email: 'dc-jam@nic.in', website: 'https://eastsinghbhum.nic.in' },
  'east singhbhum|jharkhand':     { email: 'dc-jam@nic.in', website: 'https://eastsinghbhum.nic.in' },
  'bokaro|jharkhand':             { email: 'dc-bok@nic.in', website: 'https://bokaro.nic.in' },
  'hazaribag|jharkhand':          { email: 'dc-haz@nic.in', website: 'https://hazaribag.nic.in' },
  'deoghar|jharkhand':            { email: 'dc-deo@nic.in', website: 'https://deoghar.nic.in' },

  // ── Chhattisgarh ──
  'raipur|chhattisgarh':          { email: 'collector-rpr.cg@gov.in', phone: '0771-2426024', website: 'https://raipur.gov.in' },
  'bilaspur|chhattisgarh':        { email: 'collector-bsp.cg@gov.in', website: 'https://bilaspur.gov.in' },
  'durg|chhattisgarh':            { email: 'collector-drg.cg@gov.in', website: 'https://durg.gov.in' },
  'korba|chhattisgarh':           { email: 'collector-krb.cg@gov.in', website: 'https://korba.gov.in' },
  'rajnandgaon|chhattisgarh':     { email: 'collector-rjn.cg@gov.in', website: 'https://rajnandgaon.gov.in' },
  'jagdalpur|chhattisgarh':       { email: 'collector-bst.cg@gov.in', website: 'https://bastar.gov.in' },
  'bastar|chhattisgarh':          { email: 'collector-bst.cg@gov.in', website: 'https://bastar.gov.in' },

  // ── Uttarakhand ──
  'dehradun|uttarakhand':         { email: 'dm-deh-ua@nic.in', phone: '0135-2622389', website: 'https://dehradun.nic.in' },
  'haridwar|uttarakhand':         { email: 'dm-har-ua@nic.in', website: 'https://haridwar.nic.in' },
  'nainital|uttarakhand':         { email: 'dm-nai-ua@nic.in', website: 'https://nainital.nic.in' },
  'udham singh nagar|uttarakhand':{ email: 'dm-usn-ua@nic.in', website: 'https://usnagar.nic.in' },
  'almora|uttarakhand':           { email: 'dm-alm-ua@nic.in', website: 'https://almora.nic.in' },
  'pauri garhwal|uttarakhand':    { email: 'dm-pau-ua@nic.in', website: 'https://pauri.nic.in' },
  'tehri garhwal|uttarakhand':    { email: 'dm-teh-ua@nic.in', website: 'https://tehri.nic.in' },
  'chamoli|uttarakhand':          { email: 'dm-chm-ua@nic.in', website: 'https://chamoli.nic.in' },
  'pithoragarh|uttarakhand':      { email: 'dm-pit-ua@nic.in', website: 'https://pithoragarh.nic.in' },
  'rudraprayag|uttarakhand':      { email: 'dm-rud-ua@nic.in', website: 'https://rudraprayag.nic.in' },

  // ── Himachal Pradesh ──
  'shimla|himachal pradesh':      { email: 'dc-shi-hp@nic.in', phone: '0177-2655988', website: 'https://hpshimla.nic.in' },
  'kangra|himachal pradesh':      { email: 'dc-kan-hp@nic.in', website: 'https://hpkangra.nic.in' },
  'mandi|himachal pradesh':       { email: 'dc-man-hp@nic.in', website: 'https://hpmandi.nic.in' },
  'kullu|himachal pradesh':       { email: 'dc-kul-hp@nic.in', website: 'https://hpkullu.nic.in' },
  'solan|himachal pradesh':       { email: 'dc-sol-hp@nic.in', website: 'https://hpsolan.nic.in' },
  'una|himachal pradesh':         { email: 'dc-una-hp@nic.in', website: 'https://hpuna.nic.in' },
  'hamirpur|himachal pradesh':    { email: 'dc-ham-hp@nic.in', website: 'https://hphamirpur.nic.in' },
  'bilaspur|himachal pradesh':    { email: 'dc-bil-hp@nic.in', website: 'https://hpbilaspur.nic.in' },
  'sirmaur|himachal pradesh':     { email: 'dc-sir-hp@nic.in', website: 'https://hpsirmaur.nic.in' },
  'chamba|himachal pradesh':      { email: 'dc-chm-hp@nic.in', website: 'https://hpchamba.nic.in' },
  'kinnaur|himachal pradesh':     { email: 'dc-kin-hp@nic.in', website: 'https://hpkinnaur.nic.in' },
  'lahaul and spiti|himachal pradesh': { email: 'dc-lsp-hp@nic.in', website: 'https://hplahaulspiti.nic.in' },

  // ── Assam ──
  'kamrup metropolitan|assam':    { email: 'dc-kamrupm@nic.in', phone: '0361-2540149', website: 'https://kamrupmetro.assam.gov.in' },
  'kamrup|assam':                 { email: 'dc-kamrup@nic.in', website: 'https://kamrup.assam.gov.in' },
  'nagaon|assam':                 { email: 'dc-nagaon@nic.in', website: 'https://nagaon.assam.gov.in' },
  'dibrugarh|assam':              { email: 'dc-dibrugarh@nic.in', website: 'https://dibrugarh.assam.gov.in' },
  'sonitpur|assam':               { email: 'dc-sonitpur@nic.in', website: 'https://sonitpur.assam.gov.in' },
  'cachar|assam':                 { email: 'dc-cachar@nic.in', website: 'https://cachar.assam.gov.in' },
  'jorhat|assam':                 { email: 'dc-jorhat@nic.in', website: 'https://jorhat.assam.gov.in' },
  'tinsukia|assam':               { email: 'dc-tinsukia@nic.in', website: 'https://tinsukia.assam.gov.in' },
  'sivasagar|assam':              { email: 'dc-sivasagar@nic.in', website: 'https://sivasagar.assam.gov.in' },

  // ── West Bengal ──
  'kolkata|west bengal':          { email: 'dm-ali@nic.in', phone: '033-24793713', website: 'https://s24pgs.gov.in' },
  'south 24 parganas|west bengal':{ email: 'dm-ali@nic.in', phone: '033-24793713', website: 'https://s24pgs.gov.in' },
  'north 24 parganas|west bengal':{ email: 'dm-bar@nic.in', website: 'https://north24parganas.gov.in' },
  'howrah|west bengal':           { email: 'dm-how@nic.in', website: 'https://howrah.gov.in' },
  'hooghly|west bengal':          { email: 'dm-hgl@nic.in', website: 'https://hooghly.gov.in' },
  'barddhaman|west bengal':       { email: 'dm-bdn@nic.in', website: 'https://bardhaman.gov.in' },
  'burdwan|west bengal':          { email: 'dm-bdn@nic.in', website: 'https://bardhaman.gov.in' },
  'nadia|west bengal':            { email: 'dm-nad@nic.in', website: 'https://nadia.gov.in' },
  'murshidabad|west bengal':      { email: 'dm-msd@nic.in', website: 'https://murshidabad.gov.in' },
  'midnapore|west bengal':        { email: 'dm-mid@nic.in', website: 'https://paschimmedinipur.gov.in' },
  'darjeeling|west bengal':       { email: 'dm-dar@nic.in', website: 'https://darjeeling.gov.in' },
  'jalpaiguri|west bengal':       { email: 'dm-jal@nic.in', website: 'https://jalpaiguri.gov.in' },
  'malda|west bengal':            { email: 'dm-mal@nic.in', website: 'https://malda.gov.in' },
  'birbhum|west bengal':          { email: 'dm-bir@nic.in', website: 'https://birbhum.gov.in' },

  // ── Odisha ──
  'khordha|odisha':               { email: 'dm-khurda@nic.in', phone: '06755-220001', website: 'https://khordha.nic.in' },
  'cuttack|odisha':               { email: 'dm-cuttack@nic.in', website: 'https://cuttack.nic.in' },
  'ganjam|odisha':                { email: 'dm-ganjam@nic.in', website: 'https://ganjam.nic.in' },
  'balasore|odisha':              { email: 'dm-balasore@nic.in', website: 'https://balasore.nic.in' },
  'puri|odisha':                  { email: 'dm-puri@nic.in', website: 'https://puri.nic.in' },
  'sambalpur|odisha':             { email: 'dm-sambalpur@nic.in', website: 'https://sambalpur.nic.in' },
  'mayurbhanj|odisha':            { email: 'dm-mayurbhanj@nic.in', website: 'https://mayurbhanj.nic.in' },
  'sundargarh|odisha':            { email: 'dm-sundargarh@nic.in', website: 'https://sundargarh.nic.in' },
  'koraput|odisha':               { email: 'dm-koraput@nic.in', website: 'https://koraput.nic.in' },

  // ── Delhi ──
  'new delhi|delhi':              { email: 'dcnewdelhi@nic.in', website: 'https://newdelhi.nic.in' },
  'central delhi|delhi':          { email: 'dccentral@nic.in', website: 'https://central.delhigovt.nic.in' },
  'north delhi|delhi':            { email: 'dcnorth@nic.in', website: 'https://north.delhigovt.nic.in' },
  'south delhi|delhi':            { email: 'dcsouth@nic.in', website: 'https://south.delhigovt.nic.in' },
  'east delhi|delhi':             { email: 'dceast@nic.in', website: 'https://east.delhigovt.nic.in' },
  'west delhi|delhi':             { email: 'dcwest@nic.in', website: 'https://west.delhigovt.nic.in' },
  'north west delhi|delhi':       { email: 'dcnorthwest@nic.in', website: 'https://northwest.delhigovt.nic.in' },
  'south west delhi|delhi':       { email: 'dcsouthwest@nic.in', website: 'https://southwest.delhigovt.nic.in' },
  'north east delhi|delhi':       { email: 'dcnortheast@nic.in', website: 'https://northeast.delhigovt.nic.in' },
  'south east delhi|delhi':       { email: 'dcsoutheast@nic.in', website: 'https://southeast.delhigovt.nic.in' },
  'shahdara|delhi':               { email: 'dcshahdara@nic.in', website: 'https://shahdara.delhigovt.nic.in' },

  // ── Goa ──
  'north goa|goa':                { email: 'collector-ng-goa@nic.in', website: 'https://northgoa.nic.in' },
  'south goa|goa':                { email: 'collector-sg-goa@nic.in', website: 'https://southgoa.nic.in' },

  // ── Jammu and Kashmir ──
  'srinagar|jammu and kashmir':   { email: 'dcsrinagar@nic.in', website: 'https://srinagar.nic.in' },
  'jammu|jammu and kashmir':      { email: 'dcjammu@nic.in', website: 'https://jammu.nic.in' },
  'anantnag|jammu and kashmir':   { email: 'dcanantnag@nic.in', website: 'https://anantnag.nic.in' },
  'baramulla|jammu and kashmir':  { email: 'dcbaramulla@nic.in', website: 'https://baramulla.nic.in' },
  'udhampur|jammu and kashmir':   { email: 'dcudhampur@nic.in', website: 'https://udhampur.nic.in' },
  'kathua|jammu and kashmir':     { email: 'dckathua@nic.in', website: 'https://kathua.nic.in' },

  // ── Ladakh ──
  'leh|ladakh':                   { email: 'dcleh@nic.in', website: 'https://leh.nic.in' },
  'kargil|ladakh':                { email: 'dckargil@nic.in', website: 'https://kargil.nic.in' },

  // ── Meghalaya ──
  'east khasi hills|meghalaya':   { email: 'dc-ekh@nic.in', website: 'https://eastkhasihills.gov.in' },
  'west garo hills|meghalaya':    { email: 'dc-wgh@nic.in', website: 'https://westgarohills.gov.in' },

  // ── Manipur ──
  'imphal west|manipur':          { email: 'dc-imw@nic.in', website: 'https://imphalwest.nic.in' },
  'imphal east|manipur':          { email: 'dc-ime@nic.in', website: 'https://imphaleast.nic.in' },

  // ── Mizoram ──
  'aizawl|mizoram':               { email: 'dc-aiz@nic.in', website: 'https://aizawl.nic.in' },

  // ── Nagaland ──
  'kohima|nagaland':              { email: 'dc-koh@nic.in', website: 'https://kohima.nic.in' },
  'dimapur|nagaland':             { email: 'dc-dim@nic.in', website: 'https://dimapur.nic.in' },

  // ── Tripura ──
  'west tripura|tripura':         { email: 'dm-wt@nic.in', website: 'https://westtripura.nic.in' },

  // ── Arunachal Pradesh ──
  'papum pare|arunachal pradesh': { email: 'dc-pp@nic.in', website: 'https://papumpare.nic.in' },

  // ── Sikkim ──
  'east sikkim|sikkim':           { email: 'dc-est@nic.in', website: 'https://eastsikkim.nic.in' },

  // ── Puducherry ──
  'puducherry|puducherry':        { email: 'collector.pon@nic.in', website: 'https://py.gov.in' },
};

// ─── Public API ──────────────────────────────────────────────────────

const CPGRAMS_URL = 'https://pgportal.gov.in';

/**
 * Reverse-geocode coordinates to district + state using Nominatim.
 * Returns null if geocoding fails or location is outside India.
 */
export async function reverseGeocodeDistrict(
  lat: number,
  lng: number,
): Promise<{ district: string; state: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10`,
      { headers: { 'User-Agent': 'CivicPulse/1.0' } },
    );
    const data = await res.json();
    const addr = data.address;
    if (!addr) return null;

    // Nominatim uses 'state_district' for the district name in India
    const district = addr.state_district || addr.county || addr.city || addr.town || '';
    const state = addr.state || '';

    if (!district || !state) return null;

    // Normalise: strip trailing " district" / " District"
    const cleanDistrict = district.replace(/\s+district$/i, '').trim();
    return { district: cleanDistrict, state };
  } catch {
    return null;
  }
}

/**
 * Build the DM/Collector/DC authority info for a given district + state.
 * Always returns an object — worst case with just CPGRAMS + 1077.
 */
export function buildDistrictAuthority(
  district: string,
  state: string,
): DistrictAuthority {
  const stateKey = state.toLowerCase().trim();
  const distKey = district.toLowerCase().trim();
  const lookupKey = `${distKey}|${stateKey}`;

  const config = STATE_CONFIG[stateKey];
  const title = config?.title ?? 'District Magistrate';

  const verified = VERIFIED_DISTRICTS[lookupKey];

  // Generate fallback website if not verified
  const slug = distKey.replace(/\s+/g, '');
  const fallbackWebsite = `https://${slug}.nic.in`;

  return {
    title,
    district,
    state,
    email: verified?.email,
    phone: verified?.phone,
    website: verified?.website ?? fallbackWebsite,
    cpgrams: CPGRAMS_URL,
    helpline: '1077',
  };
}
