-- Delete all old Bishkek districts
DELETE FROM districts;

-- Insert new Samara Oblast districts structure
-- Samara city districts (9)
INSERT INTO districts (name, slug) VALUES 
  ('Ленинский', 'samara-leninsky'),
  ('Самарский', 'samara-samarsky'),
  ('Октябрьский', 'samara-oktyabrsky'),
  ('Железнодорожный', 'samara-zheleznodorozhny'),
  ('Промышленный', 'samara-promyshlenny'),
  ('Советский', 'samara-sovetsky'),
  ('Кировский', 'samara-kirovsky'),
  ('Красноглинский', 'samara-krasnoglinsky'),
  ('Куйбышевский', 'samara-kuibyshevsky');

-- Togliatti districts (3)
INSERT INTO districts (name, slug) VALUES 
  ('Тольятти — Автозаводский', 'tolyatti-avtozavodsky'),
  ('Тольятти — Центральный', 'tolyatti-centralny'),
  ('Тольятти — Комсомольский', 'tolyatti-komsomolsky');

-- Other cities (no subdivisions)
INSERT INTO districts (name, slug) VALUES 
  ('Сызрань', 'syzran'),
  ('Новокуйбышевск', 'novokuybyshevsk'),
  ('Чапаевск', 'chapaevsk'),
  ('Жигулёвск', 'zhigulyovsk'),
  ('Отрадный', 'otradny'),
  ('Кинель', 'kinel'),
  ('Похвистнево', 'pohvistnevo'),
  ('Октябрьск', 'oktyabrsk');

-- Samara Oblast rural districts (21)
INSERT INTO districts (name, slug) VALUES 
  ('Волжский район', 'rayon-volzhsky'),
  ('Красноярский район', 'rayon-krasnoyarsky'),
  ('Ставропольский район', 'rayon-stavropolsky'),
  ('Кинельский район', 'rayon-kinelsky'),
  ('Безенчукский район', 'rayon-bezenchuksky'),
  ('Борский район', 'rayon-borsky'),
  ('Богатовский район', 'rayon-bogatovsky'),
  ('Большеглушицкий район', 'rayon-bolsheglushitsky'),
  ('Большечерниговский район', 'rayon-bolshechernigovsky'),
  ('Исаклинский район', 'rayon-isaklinsky'),
  ('Камышлинский район', 'rayon-kamyshlinsky'),
  ('Клявлинский район', 'rayon-klyavlinsky'),
  ('Кошкинский район', 'rayon-koshkinsky'),
  ('Нефтегорский район', 'rayon-neftegorsky'),
  ('Пестравский район', 'rayon-pestravsky'),
  ('Приволжский район', 'rayon-privolzhsky'),
  ('Сергиевский район', 'rayon-sergievsky'),
  ('Хворостянский район', 'rayon-hvorostyansky'),
  ('Шенталинский район', 'rayon-shentalinsky'),
  ('Шигонский район', 'rayon-shigonsky'),
  ('Алексеевский район', 'rayon-alekseevsky');