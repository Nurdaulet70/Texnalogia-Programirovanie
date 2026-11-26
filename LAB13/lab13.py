"""Лабораторная работа №13: коллекции и структуры данных.

Три демонстрации: список покупок (базовый уровень), анализатор текста
(средний уровень), поиск кратчайшего маршрута BFS (повышенный уровень).
"""

from __future__ import annotations

import json
import re
from collections import Counter, deque
from pathlib import Path


class ShoppingList:
    """Список покупок на основе list: порядок добавления имеет значение."""

    def __init__(self, items: list[str] | None = None) -> None:
        self.items = list(items or [])

    def add(self, name: str) -> bool:
        name = name.strip()
        if not name:
            return False
        self.items.append(name)
        return True

    def remove(self, name: str) -> bool:
        """Удаляет первое совпадение без учета регистра."""
        target = name.strip().casefold()
        for index, item in enumerate(self.items):
            if item.casefold() == target:
                del self.items[index]
                return True
        return False

    def export_json(self, path: str | Path) -> None:
        """Дополнительная функция: сохраняет текущий список в JSON."""
        Path(path).write_text(json.dumps(self.items, ensure_ascii=False, indent=2), encoding="utf-8")

    @classmethod
    def import_json(cls, path: str | Path) -> ShoppingList:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        if not isinstance(data, list) or not all(isinstance(item, str) for item in data):
            raise ValueError("Файл должен содержать JSON-список строк.")
        return cls(data)


class TextAnalyzer:
    """Подсчитывает слова словарем частот; пунктуация и регистр игнорируются."""

    @staticmethod
    def analyze(text: str) -> Counter[str]:
        words = re.findall(r"[^\W_]+(?:[-'][^\W_]+)*", text.casefold(), flags=re.UNICODE)
        return Counter(words)

    @staticmethod
    def top_words(frequencies: Counter[str], limit: int = 5) -> list[tuple[str, int]]:
        if limit < 0:
            raise ValueError("Количество слов не может быть отрицательным.")
        return sorted(frequencies.items(), key=lambda pair: (-pair[1], pair[0]))[:limit]


class RouteGraph:
    """Невзвешенный неориентированный граф; BFS на deque находит кратчайший путь."""

    def __init__(self, routes: dict[str, list[str]] | None = None) -> None:
        self.adjacency: dict[str, list[str]] = {}
        for city, neighbors in (routes or {}).items():
            self.adjacency.setdefault(city, [])
            for neighbor in neighbors:
                self.add_route(city, neighbor)

    def add_route(self, first: str, second: str) -> None:
        first, second = first.strip(), second.strip()
        if not first or not second:
            raise ValueError("Названия пунктов маршрута не могут быть пустыми.")
        self.adjacency.setdefault(first, [])
        self.adjacency.setdefault(second, [])
        if second not in self.adjacency[first]:
            self.adjacency[first].append(second)
        if first not in self.adjacency[second]:
            self.adjacency[second].append(first)

    def shortest_path(self, start: str, destination: str) -> list[str] | None:
        if start not in self.adjacency or destination not in self.adjacency:
            return None
        queue: deque[str] = deque([start])
        previous: dict[str, str | None] = {start: None}
        while queue:
            current = queue.popleft()
            if current == destination:
                path: list[str] = []
                node: str | None = current
                while node is not None:
                    path.append(node)
                    node = previous[node]
                return list(reversed(path))
            for neighbor in self.adjacency[current]:
                if neighbor not in previous:
                    previous[neighbor] = current
                    queue.append(neighbor)
        return None

    @classmethod
    def sample(cls) -> RouteGraph:
        return cls({
            "Алматы": ["Конаев", "Талдыкорган"],
            "Конаев": ["Алматы", "Балхаш"],
            "Талдыкорган": ["Алматы", "Ушарал"],
            "Балхаш": ["Конаев", "Караганда"],
            "Ушарал": ["Талдыкорган", "Семей"],
            "Караганда": ["Балхаш", "Астана"],
            "Семей": ["Ушарал", "Астана"],
            "Астана": ["Караганда", "Семей"],
        })


def print_header(title: str) -> None:
    print("\n" + "─" * 58)
    print(f"  {title}")
    print("─" * 58)


def shopping_menu() -> None:
    shopping = ShoppingList(["Хлеб", "Молоко", "Яблоки"])
    while True:
        print_header("БАЗОВЫЙ · Список покупок (list)")
        print("1. Показать список   2. Добавить товар   3. Удалить товар")
        print("4. Сохранить JSON    5. Загрузить JSON    0. Назад")
        choice = input("Выберите действие: ").strip()
        if choice == "0":
            return
        if choice == "1":
            if shopping.items:
                for number, item in enumerate(shopping.items, start=1):
                    print(f"  {number:>2}. {item}")
            else:
                print("Список пуст.")
        elif choice == "2":
            name = input("Название товара: ")
            print("Товар добавлен." if shopping.add(name) else "Название не может быть пустым.")
        elif choice == "3":
            name = input("Какой товар удалить? ")
            print("Товар удален." if shopping.remove(name) else "Такого товара нет в списке.")
        elif choice in {"4", "5"}:
            path = input("Имя JSON-файла [shopping_list.json]: ").strip() or "shopping_list.json"
            try:
                if choice == "4":
                    shopping.export_json(path)
                    print(f"Список сохранен: {path}")
                else:
                    shopping = ShoppingList.import_json(path)
                    print(f"Загружено товаров: {len(shopping.items)}")
            except (OSError, json.JSONDecodeError, ValueError) as error:
                print(f"Не удалось обработать файл: {error}")
        else:
            print("Выберите пункт меню от 0 до 5.")


def analyzer_menu() -> None:
    print_header("СРЕДНИЙ · Анализатор текста (dict / Counter)")
    text = input("Введите текст для анализа: ").strip()
    frequencies = TextAnalyzer.analyze(text)
    if not frequencies:
        print("Текст не содержит слов.")
        return
    print(f"\nВсего слов: {sum(frequencies.values())} · Уникальных: {len(frequencies)}")
    print("Топ-5 частых слов:")
    for number, (word, count) in enumerate(TextAnalyzer.top_words(frequencies), start=1):
        print(f"  {number}. {word:<20} {count} раз(а)")


def routes_menu() -> None:
    graph = RouteGraph.sample()
    print_header("ПОВЫШЕННЫЙ · Поиск маршрута (dict + deque / BFS)")
    print("Доступные города: " + ", ".join(graph.adjacency))
    start = input("Откуда: ").strip()
    destination = input("Куда: ").strip()
    path = graph.shortest_path(start, destination)
    if path is None:
        print("Маршрут не найден. Проверьте названия или связность графа.")
    else:
        print(f"Кратчайший маршрут ({len(path) - 1} перегонов): " + " → ".join(path))


def main() -> None:
    while True:
        print_header("ЛАБОРАТОРНАЯ РАБОТА №13 · СТРУКТУРЫ ДАННЫХ")
        print("  1. Базовый уровень     — список покупок")
        print("  2. Средний уровень     — анализатор частоты слов")
        print("  3. Повышенный уровень  — кратчайший маршрут BFS")
        print("  0. Выход")
        choice = input("\nВыберите задание: ").strip()
        if choice == "1":
            shopping_menu()
        elif choice == "2":
            analyzer_menu()
        elif choice == "3":
            routes_menu()
        elif choice == "0":
            print("Спасибо за работу. До свидания!")
            break
        else:
            print("Пожалуйста, введите 0, 1, 2 или 3.")


if __name__ == "__main__":
    main()
