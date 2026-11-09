import importlib
from unittest import mock

from django.db.migrations.state import StateApps

from sentry.models.artifactbundle import SourceFileType
from sentry.testutils.cases import TestMigrations

# A leading digit is legal in a module name but not in the dotted path mock.patch parses,
# so the module has to be imported by hand to patch anything on it.
migration = importlib.import_module("sentry.migrations.1253_backfill_artifactbundle_has_debug_ids")


class BackfillArtifactBundleHasDebugIdsTest(TestMigrations):
    app = "sentry"
    migrate_from = "1252_add_artifactbundle_has_debug_ids"
    migrate_to = "1253_backfill_artifactbundle_has_debug_ids"

    def setUp(self) -> None:
        # Spreads the bundles over several batches.
        with mock.patch.object(migration, "BATCH_SIZE", 2):
            super().setUp()

    def setup_before_migration(self, apps: StateApps) -> None:
        ArtifactBundle = apps.get_model("sentry", "ArtifactBundle")
        DebugIdArtifactBundle = apps.get_model("sentry", "DebugIdArtifactBundle")
        File = apps.get_model("sentry", "File")

        def create_bundle(debug_ids: int) -> int:
            bundle = ArtifactBundle.objects.create(
                organization_id=self.organization.id,
                file=File.objects.create(name="bundle.zip", type="artifact.bundle"),
                artifact_count=debug_ids,
            )
            for _ in range(debug_ids):
                DebugIdArtifactBundle.objects.create(
                    organization_id=self.organization.id,
                    debug_id="eb6e60f1-65ff-4f6f-adff-f1bbeded627b",
                    artifact_bundle=bundle,
                    source_file_type=SourceFileType.MINIFIED_SOURCE.value,
                )
            return bundle.id

        self.with_debug_ids = [create_bundle(2), create_bundle(1), create_bundle(3)]
        self.without_debug_ids = [create_bundle(0), create_bundle(0)]

    def test_backfill(self) -> None:
        ArtifactBundle = self.apps.get_model("sentry", "ArtifactBundle")
        has_debug_ids = dict(ArtifactBundle.objects.values_list("id", "has_debug_ids"))

        for bundle_id in self.with_debug_ids:
            with self.subTest(bundle_id=bundle_id):
                assert has_debug_ids[bundle_id] is True
        for bundle_id in self.without_debug_ids:
            with self.subTest(bundle_id=bundle_id):
                assert has_debug_ids[bundle_id] is False
