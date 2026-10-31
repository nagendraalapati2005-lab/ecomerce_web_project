CREATE DATABASE IF NOT EXISTS frankis_pizzeria;
USE frankis_pizzeria;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(8, 2) NOT NULL,
  category VARCHAR(40) NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY menu_items_slug_unique (slug)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number CHAR(11) NOT NULL,
  customer_name VARCHAR(80) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(200) NOT NULL,
  notes VARCHAR(300) NULL,
  subtotal DECIMAL(8, 2) NOT NULL,
  delivery_fee DECIMAL(8, 2) NOT NULL DEFAULT 0,
  total DECIMAL(8, 2) NOT NULL,
  estimated_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 40,
  status VARCHAR(30) NOT NULL DEFAULT 'received',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_order_number_unique (order_number),
  KEY orders_created_at_index (created_at),
  KEY orders_status_index (status)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(8, 2) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY order_items_order_id_index (order_id),
  CONSTRAINT order_items_order_fk FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_menu_item_fk FOREIGN KEY (menu_item_id)
    REFERENCES menu_items (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic VARCHAR(80) NOT NULL,
  name VARCHAR(80) NULL,
  contact VARCHAR(120) NULL,
  order_number CHAR(11) NULL,
  message TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY support_messages_created_at_index (created_at),
  KEY support_messages_status_index (status)
);

INSERT INTO menu_items (slug, name, description, price, category) VALUES
  ('pepperoni-special', 'pepperoni special', 'Classic pepperoni, mozzarella and tomato sauce.', 14.99, 'pizza'),
  ('margherita', 'Margherita', 'Fresh basil, mozzarella and a bright tomato base.', 17.99, 'pizza'),
  ('veggie', 'Veggie', 'Fresh vegetables, mozzarella and tomato sauce.', 19.99, 'pizza'),
  ('hawaiian-pizza', 'Hawaiian pizza', 'Ham, pineapple and mozzarella.', 17.99, 'pizza'),
  ('meat-lovers', 'Meat Lovers', 'Pepperoni, sausage, bacon and ham.', 19.99, 'pizza'),
  ('cheese', 'Cheese', 'Classic mozzarella and tomato sauce.', 12.99, 'pizza'),
  ('garlic-bread', 'Garlic Bread', 'Freshly baked garlic bread.', 5.99, 'sides'),
  ('chicken-wings', 'Chicken Wings', 'Spicy chicken wings with a side of ranch.', 9.99, 'sides'),
  ('cheese-sticks', 'Cheese Sticks', 'Freshly baked cheese sticks with marinara sauce.', 6.99, 'sides'),
  ('coke', 'Coke', 'Refreshing Coca-Cola.', 1.99, 'drinks'),
  ('sprite', 'Sprite', 'Refreshing Sprite.', 1.99, 'drinks'),
  ('fanta', 'Fanta', 'Refreshing Fanta.', 1.99, 'drinks'),
  ('special-offer', 'Today''s special offer', 'Veggie large pizza with a free drink.', 19.99, 'specials')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  category = VALUES(category);
