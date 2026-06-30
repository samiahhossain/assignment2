USE railway;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE appointment_reminders;
TRUNCATE TABLE appointments;
TRUNCATE TABLE availability_slots;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE patient_addresses;
TRUNCATE TABLE patients;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- password: Clinician1!
INSERT INTO users VALUES (
  'USR-001', 'dr.osei@intellicare.ca',
  '$2b$12$9raRPbs0v0IT12mmhvw9cOYROlGoE2.gMjEEiL5IkFwRx0SDO5zES',
  'clinician', 'Amara', 'Osei', 1, NOW(), NOW()
);

-- password: Admin1234!
INSERT INTO users VALUES (
  'USR-002', 'admin@intellicare.ca',
  '$2b$12$DQUCZKsKWHZ2ElqybWqtDeVjHeitHoazOOLdNP8JyqlLzRLf782zy',
  'admin_assistant', 'Priya', 'Nair', 1, NOW(), NOW()
);

-- password: Patient99!
INSERT INTO users VALUES (
  'USR-003', 'jane.doe@email.com',
  '$2b$12$9I4wWxICjoAXq/.66tm/RO58gvNZc1LxcgZJiOeoY5aoA/VsEwTVK',
  'patient', 'Jane', 'Doe', 1, NOW(), NOW()
);

-- password: Patient99!
INSERT INTO users VALUES (
  'USR-004', 'bob.smith@email.com',
  '$2b$12$9I4wWxICjoAXq/.66tm/RO58gvNZc1LxcgZJiOeoY5aoA/VsEwTVK',
  'patient', 'Bob', 'Smith', 1, NOW(), NOW()
);


INSERT INTO patients VALUES (
  'PAT-0001', 'USR-003',
  'Jane', 'Doe', '1985-04-12', '1234-567-890-AB',
  '902-555-0101', 'jane.doe@email.com',
  1, NOW(), NOW()
);

INSERT INTO patients VALUES (
  'PAT-0002', 'USR-004',
  'Bob', 'Smith', '1971-11-30', '9876-543-210-XY',
  '902-555-0202', 'bob.smith@email.com',
  1, NOW(), NOW()
);


INSERT INTO patient_addresses VALUES
  ('ADDR-001', 'PAT-0001', '123 Maple St', 'Halifax',    'NS', 'B3H 1A1', 1),
  ('ADDR-002', 'PAT-0002', '456 Oak Ave',  'Dartmouth',  'NS', 'B2W 3P1', 1);


INSERT INTO prescriptions VALUES (
  'RX-001', 'PAT-0001', 'USR-001', NULL,
  'Metformin', '500mg', 'twice daily', 'oral', 90, NOW()
);
INSERT INTO prescriptions VALUES (
  'RX-002', 'PAT-0001', 'USR-001', NULL,
  'Ramipril', '5mg', 'once daily', 'oral', 90, NOW()
);
INSERT INTO prescriptions VALUES (
  'RX-003', 'PAT-0002', 'USR-001', NULL,
  'Atorvastatin', '20mg', 'once daily at bedtime', 'oral', 90, NOW()
);

INSERT INTO availability_slots (slot_id, clinician_id, slot_date, start_time, end_time, is_booked) VALUES
  ('SLOT-0001','USR-001','2026-07-01','09:00','09:20',0),
  ('SLOT-0002','USR-001','2026-07-01','09:20','09:40',0),
  ('SLOT-0003','USR-001','2026-07-01','09:40','10:00',0),
  ('SLOT-0004','USR-001','2026-07-01','10:00','10:20',0),
  ('SLOT-0005','USR-001','2026-07-01','10:20','10:40',0),
  ('SLOT-0006','USR-001','2026-07-01','10:40','11:00',0),
  ('SLOT-0007','USR-001','2026-07-01','11:00','11:20',0),
  ('SLOT-0008','USR-001','2026-07-01','11:20','11:40',0),
  ('SLOT-0009','USR-001','2026-07-01','11:40','12:00',0),
  ('SLOT-0010','USR-001','2026-07-02','09:00','09:20',0),
  ('SLOT-0011','USR-001','2026-07-02','09:20','09:40',0),
  ('SLOT-0012','USR-001','2026-07-02','09:40','10:00',0),
  ('SLOT-0013','USR-001','2026-07-02','10:00','10:20',0),
  ('SLOT-0014','USR-001','2026-07-02','10:20','10:40',0),
  ('SLOT-0015','USR-001','2026-07-02','10:40','11:00',0),
  ('SLOT-0016','USR-001','2026-07-02','11:00','11:20',0),
  ('SLOT-0017','USR-001','2026-07-02','11:20','11:40',0),
  ('SLOT-0018','USR-001','2026-07-02','11:40','12:00',0),
  ('SLOT-0019','USR-001','2026-07-03','09:00','09:20',0),
  ('SLOT-0020','USR-001','2026-07-03','09:20','09:40',0),
  ('SLOT-0021','USR-001','2026-07-03','09:40','10:00',0),
  ('SLOT-0022','USR-001','2026-07-03','10:00','10:20',0),
  ('SLOT-0023','USR-001','2026-07-03','10:20','10:40',0),
  ('SLOT-0024','USR-001','2026-07-03','10:40','11:00',0),
  ('SLOT-0025','USR-001','2026-07-03','11:00','11:20',0),
  ('SLOT-0026','USR-001','2026-07-03','11:20','11:40',0),
  ('SLOT-0027','USR-001','2026-07-03','11:40','12:00',0),
  ('SLOT-0028','USR-001','2026-07-04','09:00','09:20',0),
  ('SLOT-0029','USR-001','2026-07-04','09:20','09:40',0),
  ('SLOT-0030','USR-001','2026-07-04','09:40','10:00',0),
  ('SLOT-0031','USR-001','2026-07-07','09:00','09:20',0),
  ('SLOT-0032','USR-001','2026-07-07','09:20','09:40',0),
  ('SLOT-0033','USR-001','2026-07-07','09:40','10:00',0),
  ('SLOT-0034','USR-001','2026-07-07','10:00','10:20',0),
  ('SLOT-0035','USR-001','2026-07-07','10:20','10:40',0),
  ('SLOT-0036','USR-001','2026-07-07','10:40','11:00',0),
  ('SLOT-0037','USR-001','2026-07-07','11:00','11:20',0),
  ('SLOT-0038','USR-001','2026-07-07','11:20','11:40',0),
  ('SLOT-0039','USR-001','2026-07-07','11:40','12:00',0);
