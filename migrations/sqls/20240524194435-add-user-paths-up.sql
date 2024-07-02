SET search_path TO project_name,public;

ALTER TABLE users ADD "image_path" varchar(200);
ALTER TABLE users ADD "qr_path" varchar(200);
