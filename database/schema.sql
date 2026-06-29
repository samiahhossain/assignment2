-- =============================================================================
-- railway Database Schema
-- MySQL 8.0+
-- Run this file first, then seed.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS railway
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE railway;

-- =============================================================================
-- USERS
-- Stores all authenticated principals: clinicians, admin assistants, patients
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  user_id        VARCHAR(36)  NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('clinician','admin_assistant','patient') NOT NULL,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- =============================================================================
-- PATIENTS
-- Demographic record linked to the user account when role='patient'
-- =============================================================================
CREATE TABLE IF NOT EXISTS patients (
  patient_id          VARCHAR(36)  NOT NULL,
  user_id             VARCHAR(36)  NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  date_of_birth       DATE         NOT NULL,
  health_card_number  VARCHAR(50)  NOT NULL,
  phone               VARCHAR(30)  NOT NULL,
  email               VARCHAR(255) NULL,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (patient_id),
  UNIQUE KEY uq_patients_health_card (health_card_number),
  UNIQUE KEY uq_patients_user (user_id),
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- PATIENT ADDRESSES
-- Separate table so multiple addresses can be stored per patient
-- =============================================================================
CREATE TABLE IF NOT EXISTS patient_addresses (
  address_id   VARCHAR(36)  NOT NULL,
  patient_id   VARCHAR(36)  NOT NULL,
  street       VARCHAR(255) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  province     CHAR(2)      NOT NULL,
  postal_code  VARCHAR(10)  NOT NULL,
  is_primary   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (address_id),
  CONSTRAINT fk_addresses_patient FOREIGN KEY (patient_id) REFERENCES patients (patient_id)
) ENGINE=InnoDB;

-- =============================================================================
-- AVAILABILITY SLOTS
-- Each row represents one 20-minute block in a clinician's schedule
-- =============================================================================
CREATE TABLE IF NOT EXISTS availability_slots (
  slot_id        VARCHAR(36) NOT NULL,
  clinician_id   VARCHAR(36) NOT NULL,
  slot_date      DATE        NOT NULL,
  start_time     TIME        NOT NULL,
  end_time       TIME        NOT NULL,
  is_booked      TINYINT(1)  NOT NULL DEFAULT 0,
  appointment_id VARCHAR(36) NULL,
  PRIMARY KEY (slot_id),
  KEY idx_slots_clinician_date (clinician_id, slot_date, is_booked),
  CONSTRAINT fk_slots_clinician FOREIGN KEY (clinician_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id    VARCHAR(36)  NOT NULL,
  patient_id        VARCHAR(36)  NOT NULL,
  clinician_id      VARCHAR(36)  NOT NULL,
  slot_id           VARCHAR(36)  NOT NULL,
  appointment_type  ENUM('in-person','virtual') NOT NULL DEFAULT 'in-person',
  status            ENUM('confirmed','cancelled','completed','no-show') NOT NULL DEFAULT 'confirmed',
  notes             TEXT         NULL,
  cancellation_reason TEXT       NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at      TIMESTAMP    NULL,
  PRIMARY KEY (appointment_id),
  KEY idx_appt_patient   (patient_id),
  KEY idx_appt_clinician (clinician_id),
  CONSTRAINT fk_appt_patient   FOREIGN KEY (patient_id)   REFERENCES patients (patient_id),
  CONSTRAINT fk_appt_clinician FOREIGN KEY (clinician_id) REFERENCES users    (user_id),
  CONSTRAINT fk_appt_slot      FOREIGN KEY (slot_id)      REFERENCES availability_slots (slot_id)
) ENGINE=InnoDB;

-- =============================================================================
-- APPOINTMENT REMINDERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
  reminder_id     VARCHAR(36) NOT NULL,
  appointment_id  VARCHAR(36) NOT NULL,
  reminder_type   ENUM('24h','1h') NOT NULL,
  scheduled_at    TIMESTAMP   NOT NULL,
  sent_at         TIMESTAMP   NULL,
  PRIMARY KEY (reminder_id),
  CONSTRAINT fk_reminders_appt FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id)
) ENGINE=InnoDB;

-- =============================================================================
-- PRESCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id  VARCHAR(36)  NOT NULL,
  patient_id       VARCHAR(36)  NOT NULL,
  clinician_id     VARCHAR(36)  NOT NULL,
  appointment_id   VARCHAR(36)  NULL,
  medication_name  VARCHAR(255) NOT NULL,
  dosage           VARCHAR(100) NOT NULL,
  frequency        VARCHAR(100) NOT NULL,
  route            VARCHAR(100) NOT NULL,
  duration_days    INT          NULL,
  issued_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prescription_id),
  CONSTRAINT fk_rx_patient   FOREIGN KEY (patient_id)      REFERENCES patients      (patient_id),
  CONSTRAINT fk_rx_clinician FOREIGN KEY (clinician_id)    REFERENCES users          (user_id),
  CONSTRAINT fk_rx_appt      FOREIGN KEY (appointment_id)  REFERENCES appointments   (appointment_id)
) ENGINE=InnoDB;

-- =============================================================================
-- REFRESH TOKENS  (JWT revocation tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id           VARCHAR(36)  NOT NULL,
  user_id            VARCHAR(36)  NOT NULL,
  token_hash         VARCHAR(255) NOT NULL,
  issued_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at         TIMESTAMP    NOT NULL,
  revoked_at         TIMESTAMP    NULL,
  revocation_reason  VARCHAR(100) NULL,
  PRIMARY KEY (token_id),
  KEY idx_rt_user (user_id),
  KEY idx_rt_hash (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB;
