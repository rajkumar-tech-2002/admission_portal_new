require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const initDB = async () => {
    let connection;
    try {
        console.log("Connecting to MySQL without database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });

        console.log(`Creating database ${process.env.DB_NAME} if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);

        const sqlQueries = `
            CREATE TABLE IF NOT EXISTS user_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_role VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS department_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                department VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS study_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                study VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS community_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                community VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admission_type_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admission_type VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reference_type_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reference_type VARCHAR(255) NOT NULL,
                way VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admission_status_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admission_status VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS record_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                
                reg_id VARCHAR(255) NOT NULL,
                reg_no_12th VARCHAR(255) NOT NULL,
                
                aadhaar_no VARCHAR(12) NOT NULL,
                
                std_dob DATE,
                std_name VARCHAR(255) NOT NULL,
                
                std_mobile_no VARCHAR(10) NOT NULL,
                std_whatsapp_no VARCHAR(10),
                
                city VARCHAR(255),
                
                last_studied_name LONGTEXT,
                last_studied VARCHAR(100),
                
                community VARCHAR(100),
                admission_quota VARCHAR(100),
                
                reference_type VARCHAR(100),
                reference_way VARCHAR(100),
                reference_name VARCHAR(255),
                reference_email VARCHAR(100),
                reference_institution LONGTEXT,
                reference_dept VARCHAR(255),
                reference_contact_no VARCHAR(10),
                
                selected_dept VARCHAR(255) NOT NULL,
                selected_ug_pg VARCHAR(100) NOT NULL,
                selected_course VARCHAR(255) NOT NULL,
                
                admission_status VARCHAR(255) NOT NULL DEFAULT 'Enquiry',
                
                email_status ENUM('Pending', 'Sent', 'Failed') DEFAULT 'Pending',
                email_sent_at DATETIME NULL,
                
                admission_date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                archive_status VARCHAR(100) NOT NULL DEFAULT 'New',
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                record_id INT NOT NULL,
                reg_id VARCHAR(255) NOT NULL,
                recipient_email VARCHAR(255) NOT NULL,
                status ENUM('Sent', 'Failed') NOT NULL,
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (record_id) REFERENCES record_master(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS valid_date_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date_count INT NOT NULL DEFAULT 30,
                archive_status TEXT,
                reference_way TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS district_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                district_name VARCHAR(100) NOT NULL,
                state_name VARCHAR(100) NOT NULL DEFAULT 'TAMILNADU',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS school_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                state_name VARCHAR(100) NOT NULL DEFAULT 'TAMILNADU',
                district_name VARCHAR(100) NOT NULL,
                city VARCHAR(100) NOT NULL,
                school_name LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS consultancy_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                consultancy_name VARCHAR(255),
                consultancy_person_name VARCHAR(255),
                consultancy_mobile VARCHAR(255),
                consultancy_city VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS staff_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                staff_code VARCHAR(100) NOT NULL,
                staff_name VARCHAR(255) NOT NULL,
                staff_department VARCHAR(150) NULL,
                staff_institution VARCHAR(150) NULL,
                staff_type VARCHAR(100) NULL,
                staff_email VARCHAR(150) NULL,
                staff_phone VARCHAR(100) NULL,
                staff_address TEXT NULL,
                individual_target INT DEFAULT 0,
                admission_count INT DEFAULT 0,
                connection_field VARCHAR(150) NULL,
                password VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_staff_code (staff_code),
                INDEX idx_staff_name (staff_name),
                INDEX idx_staff_department (staff_department),
                INDEX idx_staff_phone (staff_phone),
                INDEX idx_staff_type (staff_type)
            );

            CREATE TABLE IF NOT EXISTS annual_income_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                income_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS religion_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                religion_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS school_type_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_type_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admission_year_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admission_year_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS group_in_12th_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS role_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS student_admission_master (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reg_no_12th VARCHAR(255) NULL,
                student_name VARCHAR(255) NULL,
                dob DATE NULL,
                college VARCHAR(255) NULL,
                admission_date DATE NULL,
                department VARCHAR(255) NULL,
                admission_year VARCHAR(255) NULL,
                quota VARCHAR(255) NULL,
                first_graduate VARCHAR(255) NULL,
                student_status VARCHAR(255) NULL,
                remark TEXT NULL,
                aadhaar_no VARCHAR(255) NULL,
                school_type VARCHAR(255) NULL,
                fee DECIMAL(10,2) NULL,
                reference_remark TEXT NULL,
                reference_amount_1 DECIMAL(10,2) NULL,
                reference_paid_amount DECIMAL(10,2) NULL,
                community VARCHAR(255) NULL,
                father_name VARCHAR(255) NULL,
                mother_name VARCHAR(255) NULL,
                father_mobile_no VARCHAR(255) NULL,
                student_mobile_no VARCHAR(255) NULL,
                mother_mobile_no VARCHAR(255) NULL,
                father_occupation VARCHAR(255) NULL,
                father_annual_income VARCHAR(255) NULL,
                religion VARCHAR(255) NULL,
                caste_name VARCHAR(255) NULL,
                gender VARCHAR(255) NULL,
                student_email VARCHAR(255) NULL,
                address_1 VARCHAR(255) NULL,
                address_2 VARCHAR(255) NULL,
                pincode VARCHAR(255) NULL,
                country VARCHAR(255) NULL,
                state VARCHAR(255) NULL,
                district VARCHAR(255) NULL,
                city VARCHAR(255) NULL,
                is_10th VARCHAR(50) NULL DEFAULT 'No',
                school_10th_district VARCHAR(255) NULL,
                school_10th_city VARCHAR(255) NULL,
                school_10th_name VARCHAR(255) NULL,
                mark_10th DECIMAL(10,2) NULL,
                reg_no_10th VARCHAR(255) NULL,
                total_marks_10th DECIMAL(10,2) NULL,
                percentage_10th VARCHAR(255) NULL,
                yop_10th VARCHAR(255) NULL,
                is_12th VARCHAR(50) NULL DEFAULT 'No',
                school_12th_district VARCHAR(255) NULL,
                school_12th_city VARCHAR(255) NULL,
                school_12th_name VARCHAR(255) NULL,
                mark_sheet_given_status VARCHAR(255) NULL,
                yop_12th VARCHAR(255) NULL,
                group_in_12th VARCHAR(255) NULL,
                subject_1_name VARCHAR(255) NULL,
                subject_1_mark DECIMAL(10,2) NULL,
                subject_2_name VARCHAR(255) NULL,
                subject_2_mark DECIMAL(10,2) NULL,
                subject_3_name VARCHAR(255) NULL,
                subject_3_mark DECIMAL(10,2) NULL,
                subject_4_name VARCHAR(255) NULL,
                subject_4_mark DECIMAL(10,2) NULL,
                subject_5_name VARCHAR(255) NULL,
                subject_5_mark DECIMAL(10,2) NULL,
                subject_6_name VARCHAR(255) NULL,
                subject_6_mark DECIMAL(10,2) NULL,
                total_marks_12th DECIMAL(10,2) NULL,
                percentage_12th VARCHAR(255) NULL,
                ug_university VARCHAR(255) NULL,
                reference_type VARCHAR(255) NULL,
                reference_college VARCHAR(255) NULL,
                reference_department VARCHAR(255) NULL,
                reference_by_name VARCHAR(255) NULL,
                reference_by_mobile VARCHAR(255) NULL,
                consultancy_name VARCHAR(255) NULL,
                consultancy_person_name VARCHAR(255) NULL,
                consultancy_mobile VARCHAR(255) NULL,
                course_studied VARCHAR(255) NULL,
                studied_medium VARCHAR(255) NULL,
                board_university VARCHAR(255) NULL,
                nativity VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        // We need to split multiple queries as mysql2 doesn't support multipleStatements by default 
        // unless explicitly enabled, but it's safer to run them one by one or enable it.
        // Let's enable it just for setup.
        
        const multiConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log("Creating tables...");
        await multiConnection.query(sqlQueries);

        // Insert Master Data
        console.log("Inserting master data if empty...");
        const [deptCount] = await multiConnection.query('SELECT COUNT(*) as count FROM department_master');
        if (deptCount[0].count === 0) {
            await multiConnection.query(`
                INSERT INTO department_master (department, type) VALUES
                ('NPC-DAE', 'DIPLOMA'), ('NPC-DAGRI', 'DIPLOMA'), ('NPC-DCIVIL', 'DIPLOMA'), ('NPC-DCOMP', 'DIPLOMA'), 
                ('NPC-DECE', 'DIPLOMA'), ('NPC-DEEE', 'DIPLOMA'), ('NPC-DME', 'DIPLOMA'), ('NPC-DPCE', 'DIPLOMA'),
                ('NCT-M.E_CS', 'PG'), ('NCT-M.E_CSE', 'PG'), ('NEC-M.E_CSE', 'PG'), ('NEC-MBA', 'PG'), ('NEC-MCA', 'PG'),
                ('NCT-B.E_CSE', 'UG'), ('NCT-B.E_ECE', 'UG'), ('NCT-B.E_EEE', 'UG'), ('NCT-B.Tech_AI_DS', 'UG'), ('NCT-B.Tech_IT', 'UG'),
                ('NEC-B.E_AGRI', 'UG'), ('NEC-B.E_BME', 'UG'), ('NEC-B.E_CSE_CS', 'UG'), ('NEC-B.E_ECE', 'UG'), ('NEC-B.E_EEE', 'UG'), 
                ('NEC-B.E_CIVIL', 'UG'), ('NEC-B.E_CSE', 'UG'), ('NEC-B.E_MECH', 'UG'), ('NEC-B.Tech_Al_DS', 'UG'), ('NEC-B.Tech_CHEM', 'UG'), 
                ('NEC-B.Tech_IT', 'UG'), ('NEC-B.E_CSE_IOT', 'UG');
            `);
        }

        const [studyCount] = await multiConnection.query('SELECT COUNT(*) as count FROM study_master');
        if (studyCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO study_master (study) VALUES ('10th'), ('12th'), ('UG'), ('DIPLOMA');`);
        }

        const [commCount] = await multiConnection.query('SELECT COUNT(*) as count FROM community_master');
        if (commCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO community_master (community) VALUES ('BC'), ('BCM'), ('MBC'), ('SC'), ('SCA'), ('ST'), ('OC'), ('Others');`);
        }

        const [typeCount] = await multiConnection.query('SELECT COUNT(*) as count FROM admission_type_master');
        if (typeCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO admission_type_master (admission_type) VALUES ('Government Quota'), ('Management Quota');`);
        }

        const [refCount] = await multiConnection.query('SELECT COUNT(*) as count FROM reference_type_master');
        if (refCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO reference_type_master (reference_type, way) VALUES ('Staff', 'Normal'), ('Student', 'Direct'), ('Alumni', 'Normal'), ('Agent', 'Normal'), ('Others', 'Normal');`);
        }

        const [statusCount] = await multiConnection.query('SELECT COUNT(*) as count FROM admission_status_master');
        if (statusCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO admission_status_master (admission_status) VALUES ('Enquiry'), ('Admitted'), ('Discontinue');`);
        }

        const [validDateCount] = await multiConnection.query('SELECT COUNT(*) as count FROM valid_date_master');
        if (validDateCount[0].count === 0) {
            await multiConnection.query(`INSERT INTO valid_date_master (date_count, archive_status, reference_way) VALUES (30, 'Discontinue', 'Normal');`);
        }

        const [roleCount] = await multiConnection.query('SELECT COUNT(*) as count FROM role_master');
        if (roleCount[0].count === 0) {
            await multiConnection.query(`
                INSERT INTO role_master (role_name) 
                VALUES ('admin'), ('enquiry_team'), ('admission_team');
            `);
            console.log("role_master table seeded with default roles!");
        }

        // Insert Admin User
        const [userCount] = await multiConnection.query('SELECT COUNT(*) as count FROM user_master WHERE user_id = "admin"');
        if (userCount[0].count === 0) {
            console.log("Creating default admin user...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin@12345', salt);
            await multiConnection.query(`
                INSERT INTO user_master (user_role, user_id, password_hash)
                VALUES ('admin', 'admin', ?)
            `, [hashedPassword]);
            console.log("Admin user created: admin / Admin@12345");
        } else {
            console.log("Admin user already exists.");
        }

        // Insert Enquiry Team User
        const [enquiryCount] = await multiConnection.query('SELECT COUNT(*) as count FROM user_master WHERE user_id = "enquiry"');
        if (enquiryCount[0].count === 0) {
            console.log("Creating default enquiry team user...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Enquiry@12345', salt);
            await multiConnection.query(`
                INSERT INTO user_master (user_role, user_id, password_hash)
                VALUES ('enquiry_team', 'enquiry', ?)
            `, [hashedPassword]);
            console.log("Enquiry user created: enquiry / Enquiry@12345");
        }

        // Insert Admission Team User
        const [admissionCount] = await multiConnection.query('SELECT COUNT(*) as count FROM user_master WHERE user_id = "admission"');
        if (admissionCount[0].count === 0) {
            console.log("Creating default admission team user...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admission@12345', salt);
            await multiConnection.query(`
                INSERT INTO user_master (user_role, user_id, password_hash)
                VALUES ('admission_team', 'admission', ?)
            `, [hashedPassword]);
            console.log("Admission user created: admission / Admission@12345");
        }

        console.log("Database initialized successfully!");
        await multiConnection.end();
        await connection.end();

    } catch (error) {
        console.error("Error initializing database:", error);
    }
};

initDB();
