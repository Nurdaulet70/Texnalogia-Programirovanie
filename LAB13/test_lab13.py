import json
import tempfile
import unittest
from pathlib import Path

from lab13 import RouteGraph, ShoppingList, TextAnalyzer


class ShoppingListTests(unittest.TestCase):
    def test_add_and_remove_item_case_insensitive(self):
        items = ShoppingList()
        self.assertTrue(items.add(" Молоко "))
        self.assertTrue(items.remove("мОЛОКО"))
        self.assertEqual(items.items, [])

    def test_empty_name_and_missing_item_are_handled(self):
        items = ShoppingList()
        self.assertFalse(items.add("  "))
        self.assertFalse(items.remove("Хлеб"))
        self.assertEqual(items.items, [])

    def test_json_round_trip(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "shopping.json"
            original = ShoppingList(["Чай", "Сыр"])
            original.export_json(path)
            self.assertEqual(ShoppingList.import_json(path).items, ["Чай", "Сыр"])


class TextAnalyzerTests(unittest.TestCase):
    def test_counts_ignore_case_and_punctuation(self):
        counts = TextAnalyzer.analyze("Python, python! Структуры — данные.")
        self.assertEqual(counts["python"], 2)
        self.assertEqual(counts["структуры"], 1)

    def test_empty_text_and_top_five(self):
        self.assertEqual(TextAnalyzer.analyze("... !!!"), {})
        counts = TextAnalyzer.analyze("a b c d e f a b c d e a b c d a b c a b a")
        self.assertEqual(len(TextAnalyzer.top_words(counts)), 5)
        with self.assertRaises(ValueError):
            TextAnalyzer.top_words(counts, -1)


class RouteGraphTests(unittest.TestCase):
    def test_bfs_returns_shortest_path(self):
        graph = RouteGraph({"A": ["B", "C"], "B": ["D"], "C": ["D"]})
        self.assertEqual(len(graph.shortest_path("A", "D")), 3)
        self.assertEqual(graph.shortest_path("A", "A"), ["A"])

    def test_unknown_or_unreachable_city_returns_none(self):
        graph = RouteGraph({"A": ["B"], "X": []})
        self.assertIsNone(graph.shortest_path("A", "Missing"))
        self.assertIsNone(graph.shortest_path("A", "X"))

    def test_add_route_is_bidirectional_and_does_not_duplicate(self):
        graph = RouteGraph()
        graph.add_route("A", "B")
        graph.add_route("A", "B")
        self.assertEqual(graph.adjacency, {"A": ["B"], "B": ["A"]})


if __name__ == "__main__":
    unittest.main(verbosity=2)
