-- Delete all trips (cascades to schedules and expenses)
DELETE FROM trips;

-- Verify deletion
SELECT COUNT(*) as trips_count FROM trips;
SELECT COUNT(*) as schedules_count FROM schedules;
SELECT COUNT(*) as expenses_count FROM expenses;

