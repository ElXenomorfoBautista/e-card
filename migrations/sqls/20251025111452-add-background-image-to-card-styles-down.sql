-- Revertir: eliminar columna background_image_url
ALTER TABLE e_card.card_styles
DROP COLUMN IF EXISTS background_image_url;
