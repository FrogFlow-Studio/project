import { describe, it, expect } from 'vitest';
const {
  scoreQuiz,
  computeBlockStates,
  progressPercent,
  normalizeOutline,
  generateInviteCode,
  escapeXml
} = require('../src/logic');

describe('Модульные тесты бизнес-логики платформы (src/logic.js)', () => {
  it('1. scoreQuiz: правильный расчёт баллов за тест и порог зачёта 70%', () => {
    const questions = [
      { id: '1', correct_index: 0, explanation: 'exp 1' },
      { id: '2', correct_index: 2, explanation: 'exp 2' },
      { id: '3', correct_index: 1, explanation: 'exp 3' },
      { id: '4', correct_index: 3, explanation: 'exp 4' }
    ];

    // 4 из 4 = 100%
    const res100 = scoreQuiz(questions, [0, 2, 1, 3]);
    expect(res100.score).toBe(100);
    expect(res100.passed).toBe(true);
    expect(res100.correct).toBe(4);

    // 3 из 4 = 75% (порог 70% пройден)
    const res75 = scoreQuiz(questions, [0, 2, 1, 0]);
    expect(res75.score).toBe(75);
    expect(res75.passed).toBe(true);

    // 2 из 4 = 50% (не пройден) - правильные ответы на позициях 0 и 1: [0, 2, 0, 0]
    const res50 = scoreQuiz(questions, [0, 2, 0, 0]);
    expect(res50.score).toBe(50);
    expect(res50.passed).toBe(false);
  });

  it('2. computeBlockStates: блоки открываются последовательно после сдачи теста и практики', () => {
    const blocks = [
      { id: 'b1', position: 1 },
      { id: 'b2', position: 2 },
      { id: 'b3', position: 3 }
    ];

    // Блок 1 только начат: открыт только Блок 1
    const statesInit = computeBlockStates(blocks, [], []);
    expect(statesInit[0].unlocked).toBe(true);
    expect(statesInit[0].completed).toBe(false);
    expect(statesInit[1].unlocked).toBe(false);

    // Сдан только тест в блоке 1 (практика не сдана) -> Блок 2 всё ещё заблокирован
    const statesQuizOnly = computeBlockStates(
      blocks,
      [{ block_id: 'b1', score: 80, passed: true }],
      []
    );
    expect(statesQuizOnly[0].completed).toBe(false);
    expect(statesQuizOnly[1].unlocked).toBe(false);

    // Сдан и тест, и практика в блоке 1 -> Блок 1 завершён, Блок 2 открывается
    const statesB1Done = computeBlockStates(
      blocks,
      [{ block_id: 'b1', score: 80, passed: true }],
      [{ block_id: 'b1', score: 85, passed: true }]
    );
    expect(statesB1Done[0].completed).toBe(true);
    expect(statesB1Done[1].unlocked).toBe(true);
    expect(statesB1Done[2].unlocked).toBe(false);

    // Прогресс курса
    expect(progressPercent(statesB1Done)).toBe(33);
  });

  it('3. normalizeOutline: валидация и ограничение списка блоков', () => {
    const raw = [
      { title: '  HTML и CSS  ', goal: 'Освоить вёрстку' },
      { title: 'JavaScript' }
    ];
    const normalized = normalizeOutline(raw);
    expect(normalized.length).toBe(2);
    expect(normalized[0].position).toBe(1);
    expect(normalized[0].title).toBe('HTML и CSS');
    expect(normalized[1].position).toBe(2);
    expect(normalized[1].goal).toBe('');

    // Пустой список должен вызывать ошибку
    expect(() => normalizeOutline([])).toThrow();
  });

  it('4. generateInviteCode: код ровно 6 символов без двусмысленных знаков', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    expect(code).not.toMatch(/[01OI]/);
  });

  it('5. escapeXml: экранирование специальных символов для защиты от промпт-инъекций', () => {
    const input = '<script alert("1") & "test">';
    const out = escapeXml(input);
    expect(out).toBe('&lt;script alert("1") &amp; "test"&gt;');
  });
});
