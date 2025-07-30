SET search_path TO e_card,public;

ALTER TABLE users ADD "image_path" varchar(200);
ALTER TABLE users ADD "qr_path" varchar(200);
