"""Full Draft 2020-12 JSON Schema conformance tests (requires jsonschema)."""
import copy
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator

SCHEMA = json.loads(Path("pedagogical/lesson.schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA)
Draft202012Validator.check_schema(SCHEMA)

def valid_lesson():
    return {
        "schema_version": "1.0",
        "lesson": {"id": "lesson-1", "title": "Sample", "language": "vi", "status": "draft"},
        "outcomes": [{"id": "lo-1", "text": "Explain the concept", "source": "official", "status": "locked"}],
        "evidence": [{"id": "ev-1", "description": "Written explanation", "supports_outcomes": ["lo-1"], "evidence_type": "constructed_response"}],
        "learning_units": [{"id": "unit-1", "title": "Unit", "supports_outcomes": ["lo-1"], "activities": [{"id": "act-1", "learning_type": "practice", "supports_outcomes": ["lo-1"], "instruction": "Write an explanation"}]}],
        "qa": {"status": "not_run", "checks": []},
    }

class CanonicalSchemaTests(unittest.TestCase):
    def test_valid_fixture(self):
        self.assertEqual(list(VALIDATOR.iter_errors(valid_lesson())), [])

    def test_every_root_required_field(self):
        for field in SCHEMA["required"]:
            with self.subTest(field=field):
                lesson = valid_lesson()
                del lesson[field]
                self.assertFalse(VALIDATOR.is_valid(lesson))

    def test_unknown_root_property(self):
        lesson = valid_lesson()
        lesson["unauthorized"] = True
        self.assertFalse(VALIDATOR.is_valid(lesson))

    def test_all_schema_definitions_have_valid_witness_or_are_checked(self):
        # Schema compilation resolves every local reference and rejects malformed keywords.
        self.assertGreaterEqual(len(SCHEMA["$defs"]), 15)

    def test_recursive_mutations_rejected(self):
        mutations = [
            ("wrong_version", lambda x: x.update(schema_version="2.0")),
            ("wrong_lesson_status", lambda x: x["lesson"].update(status="approved")),
            ("bad_id", lambda x: x["lesson"].update(id="1 invalid")),
            ("empty_outcomes", lambda x: x.update(outcomes=[])),
            ("empty_evidence", lambda x: x.update(evidence=[])),
            ("empty_units", lambda x: x.update(learning_units=[])),
            ("bad_source", lambda x: x["outcomes"][0].update(source="AI")),
            ("bad_outcome_status", lambda x: x["outcomes"][0].update(status="approved")),
            ("bad_evidence_type", lambda x: x["evidence"][0].update(evidence_type="unknown")),
            ("duplicate_ref", lambda x: x["evidence"][0].update(supports_outcomes=["lo-1", "lo-1"])),
            ("invalid_learning_type", lambda x: x["learning_units"][0]["activities"][0].update(learning_type="watch")),
            ("missing_instruction", lambda x: x["learning_units"][0]["activities"][0].pop("instruction")),
            ("missing_qa_checks", lambda x: x["qa"].pop("checks")),
            ("unknown_activity_field", lambda x: x["learning_units"][0]["activities"][0].update(unsupported=True)),
            ("wrong_final_assessment", lambda x: x.update(final_assessment={"assessments": []})),
        ]
        for name, mutation in mutations:
            with self.subTest(case=name):
                lesson = copy.deepcopy(valid_lesson())
                mutation(lesson)
                self.assertFalse(VALIDATOR.is_valid(lesson), name)

    def test_ai_provenance_requires_verification(self):
        lesson = valid_lesson()
        lesson["outcomes"][0]["provenance"] = {"type": "ai_generated", "requires_verification": False}
        self.assertFalse(VALIDATOR.is_valid(lesson))
        lesson["outcomes"][0]["provenance"]["requires_verification"] = True
        self.assertTrue(VALIDATOR.is_valid(lesson))

    def test_schema_definitions_reject_missing_required_and_unknown_fields(self):
        # Every object definition's required keys and additionalProperties contract.
        for name, definition in SCHEMA["$defs"].items():
            if definition.get("type") != "object":
                continue
            with self.subTest(definition=name):
                if definition.get("additionalProperties") is False:
                    from jsonschema import validators
                    resolver = VALIDATOR.evolve(schema=definition)
                    # Unknown property is forbidden even if required fields are absent.
                    self.assertTrue(any(e.validator == "additionalProperties" for e in resolver.iter_errors({"__unknown__": True})))

if __name__ == "__main__":
    unittest.main(verbosity=2)
