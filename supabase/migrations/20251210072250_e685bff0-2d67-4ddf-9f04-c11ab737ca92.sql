-- Добавляем RESTRICTIVE политику, которая ЯВНО запрещает анонимный доступ к profiles
-- Это гарантирует, что даже если другие политики есть, анонимы не получат доступ

-- Удаляем существующие политики и пересоздаём их правильно
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Создаём RESTRICTIVE политику - требует аутентификации для ЛЮБОГО доступа
-- Это базовый слой защиты, который нельзя обойти
CREATE POLICY "Require authentication for all access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Теперь создаём PERMISSIVE политики для конкретных случаев
-- Они работают только если RESTRICTIVE политика уже прошла

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Аналогичная защита для bookings таблицы
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Performers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;

-- RESTRICTIVE политика для bookings - явный запрет анонимного доступа
CREATE POLICY "Require authentication for all booking access"
ON public.bookings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- PERMISSIVE политики для bookings
CREATE POLICY "Customers can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Performers can view their bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (performer_id IN (
  SELECT id FROM performer_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id 
  OR performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));