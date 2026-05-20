const fs = require('fs');
const path = 'client/src/pages/Admission/AdmissionProcess.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/if \(activeSection === 'staff'\)/g, "if (activeSection === 'staff' || activeSection === 'entry')");

fs.writeFileSync(path, content);
console.log('Fixed useEffect fetch condition via file script');
