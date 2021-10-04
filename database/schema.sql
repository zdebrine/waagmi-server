DROP DATABASE IF EXISTS seedlingdb;

CREATE DATABASE seedlingdb;

\c seedlingdb;

CREATE TABLE users(
   user_id INT GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
   name VARCHAR(255) NOT NULL,
   email VARCHAR(50),
    sub_id VARCHAR(100),
    stripe_id VARCHAR(150),
    instagram VARCHAR(100),
    linkedin VARCHAR(100),
    CONSTRAINT user_unique UNIQUE (sub_id),
   PRIMARY KEY(user_id)
);

CREATE TABLE companies(
   company_id INT GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
   user_id INT,
   business_name VARCHAR(255) NOT NULL,
   website VARCHAR(80),
   short_description VARCHAR(700),
   problem VARCHAR(700),
   overview VARCHAR(700),
   business_model VARCHAR(700),
   image VARCHAR(100),
   about VARCHAR(700),
   funding_page_markdown VARCHAR(10000),
   end_date DATE,
   estimated_profits INT,
   use_of_funds VARCHAR(700),
   investor_perks VARCHAR(300),
    fundraising_goal INT,
    multiplier NUMERIC(5,2),
    profits_allocated INT,
    active_fundraise BOOLEAN,
    active_payback BOOLEAN,
    paid_back BOOLEAN,
   CONSTRAINT company_unique UNIQUE (business_name),
   PRIMARY KEY(company_id),
   CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
	  REFERENCES users(user_id)
);

CREATE TABLE investments(
    investment_id INT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
    date DATE,
    amount INT,
    user_id INT,
    company_id INT,
    PRIMARY KEY(investment_id),
    CONSTRAINT fk_company
        FOREIGN KEY (company_id)
        REFERENCES companies (company_id), 
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id) 
);

CREATE TABLE payouts(
    payout_id INT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
    date DATE,
    amount INT,
    paid BOOLEAN,
    pnl VARCHAR(100),
    transaction_id VARCHAR(150),
    company_id INT,
   PRIMARY KEY (payout_id),
   CONSTRAINT fk_company
        FOREIGN KEY (company_id)
        REFERENCES companies(company_id) 
);

CREATE TABLE messages(
   user_id INT GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
   message VARCHAR,
   PRIMARY KEY(user_id)
);