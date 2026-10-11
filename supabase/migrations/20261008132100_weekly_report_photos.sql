ALTER TABLE public.weekly_reports
    ADD COLUMN IF NOT EXISTS photo_paths text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'weekly-report-photos',
    'weekly-report-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Weekly report photos are viewable by report readers"
    ON storage.objects;

DROP POLICY IF EXISTS "Weekly report readers can add photos"
    ON storage.objects;

DROP POLICY IF EXISTS "Weekly report readers can remove photos"
    ON storage.objects;

CREATE POLICY "Weekly report photos are viewable by report readers"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'weekly-report-photos'
        AND EXISTS (
            SELECT 1
            FROM public.weekly_reports AS report
            WHERE report.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Weekly report readers can add photos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'weekly-report-photos'
        AND EXISTS (
            SELECT 1
            FROM public.weekly_reports AS report
            WHERE report.id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Weekly report readers can remove photos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'weekly-report-photos'
        AND EXISTS (
            SELECT 1
            FROM public.weekly_reports AS report
            WHERE report.id::text = (storage.foldername(name))[1]
        )
    );