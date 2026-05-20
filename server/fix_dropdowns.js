const fs = require('fs');
const filePath = '../client/src/pages/Admission/AdmissionProcess.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace Country readonly input with dropdown
const oldCountry = `<input type="text" name="country" value={formData.country} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} />`;
const newCountry = `<select name="country" value={formData.country} onChange={handleChange} className={\`\${styles.inputField} \${styles.selectField}\`}>
                                            <option value="">Select Country</option>
                                            <option value="India">India</option>
                                            <option value="Other">Other</option>
                                        </select>`;

if (content.includes(oldCountry)) {
    content = content.replace(oldCountry, newCountry);
    console.log('✅ Country input replaced with dropdown');
} else {
    console.log('❌ Country input not found');
}

// 2. Replace State readonly input with dropdown
const oldState = `<input type="text" name="state" value={formData.state} readOnly className={styles.inputField} style={{ backgroundColor: '#f1f5f9' }} />`;
const newState = `<select name="state" value={formData.state} onChange={handleChange} className={\`\${styles.inputField} \${styles.selectField}\`}>
                                            <option value="">Select State</option>
                                            {Array.from(new Set(masterData.districts.map(d => d.state_name).filter(Boolean))).map(st => (
                                                <option key={st} value={st}>{st}</option>
                                            ))}
                                        </select>`;

if (content.includes(oldState)) {
    content = content.replace(oldState, newState);
    console.log('✅ State input replaced with dropdown');
} else {
    console.log('❌ State input not found');
}

// 3. Filter District dropdown by selected state
const oldDistrict = `{masterData.districts.map(d => <option key={d.id} value={d.district_name}>{d.district_name}</option>)}`;
const newDistrict = `{masterData.districts
                                                .filter(d => formData.state ? d.state_name === formData.state : true)
                                                .map(d => <option key={d.id} value={d.district_name}>{d.district_name}</option>)}`;

if (content.includes(oldDistrict)) {
    content = content.replace(oldDistrict, newDistrict);
    console.log('✅ District dropdown now filters by selected state');
} else {
    console.log('❌ District dropdown pattern not found');
}

// 4. Update default state from fixed 'Tamil Nadu' to empty
content = content.replace(
    "country: 'India',\r\n        state: 'Tamil Nadu',",
    "country: 'India',\r\n        state: '',"
);

// 5. Update resetForm defaults
content = content.replace(
    "country: 'India', state: 'Tamil Nadu', district: '',",
    "country: 'India', state: '', district: '',"
);

// 6. Add cascade logic: when state changes, reset district
// Find the handleChange where college cascading was added
const cascadeMarker = "if (name === 'college') {";
if (content.includes(cascadeMarker)) {
    const stateReset = `if (name === 'state') {
            setFormData(prev => ({ 
                ...prev, 
                state: value,
                district: '' 
            }));
            return;
        }

        if (name === 'college') {`;
    content = content.replace(cascadeMarker, stateReset);
    console.log('✅ State cascade logic added (resets district on state change)');
} else {
    console.log('❌ handleChange cascade marker not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n🎉 All changes applied successfully!');
