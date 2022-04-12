DROP DATABASE IF EXISTS wagmidb;

CREATE DATABASE wagmidb;

\c wagmidb;

CREATE TABLE discounts(
    discount_id INT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 999999 CACHE 1 ),
    collection_name VARCHAR NOT NULL,
    collection_url VARCHAR ,
    slug VARCHAR ,
    discount INT,
    is_percent BOOLEAN ,
    code VARCHAR ,
    shop_id VARCHAR,
    domain VARCHAR,
    PRIMARY KEY(discount_id)
);