/**
 * Автоматические модульные тесты серверной части платформы онлайн-курса «Web разработчик»
 * Проверяют декомпозицию темы через ИИ, безопасность тестов (скрытие правильных ответов),
 * серверный подсчёт баллов, проверку практического кода и режим подсказок ИИ-наставника.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import db from '../src/db.js';
import ai from '../src/ai.js';

describe('Серверная логика платформы онлайн-курса «Web разработчик» с ИИ', () => {
  beforeEach(() => {
    db.resetLocalDb();
  });

  it('1. Загружает предзаполненные курсы и скрывает правильные ответы тестов от клиента студента', async () => {
    const courses = await db.listCourses();
    expect(courses.length).toBeGreaterThanOrEqual(2);

    const studentView = await db.getCourseDetails('c-webdev-full', false);
    expect(studentView).not.toBeNull();
    expect(studentView.blocks.length).toBe(4);

    const firstQuizQuestion = studentView.blocks[0].quiz_questions[0];
    expect(firstQuizQuestion.question_text).toBeDefined();
    expect(firstQuizQuestion.correct_index).toBeUndefined();

    const teacherView = await db.getCourseDetails('c-webdev-full', true);
    expect(teacherView.blocks[0].quiz_questions[0].correct_index).toBeTypeOf('number');
  });

  it('2. Генерирует учебные блоки, теоретические материалы, тесты и задания по введённой теме через модуль ИИ', async () => {
    const generated = await ai.generateCourseFromTopic({
      topic: 'Асинхронное серверное программирование на Node.js и WebSockets',
      difficulty: 'Средний',
      blocksCount: 3
    });

    expect(generated.title).toContain('Node.js');
    expect(generated.blocks.length).toBe(3);
    expect(generated.blocks[0].quiz_questions.length).toBeGreaterThanOrEqual(2);
    expect(generated.blocks[0].practice_task).toBeDefined();

    const saved = await db.saveGeneratedCourse(generated);
    expect(saved.id).toBeDefined();
    expect(saved.blocks.length).toBe(3);
  });

  it('3. Корректно вычисляет оценку за тест на стороне сервера и обновляет прогресс студента', async () => {
    const passResult = await db.evaluateAndSaveQuiz('u-student-01', 'b-html-css', [1, 0, 1]);
    expect(passResult.score).toBe(100);
    expect(passResult.passed).toBe(true);
    expect(passResult.correctCount).toBe(3);

    const failResult = await db.evaluateAndSaveQuiz('u-student-02', 'b-html-css', [0, 1, 0]);
    expect(failResult.score).toBe(0);
    expect(failResult.passed).toBe(false);
  });

  it('4. Оценивает практический код студента по критериям и выявляет недостающие конструкции', async () => {
    const validCode = `
      <main class="modules-grid">
        <article class="module-item"><h2>Урок</h2></article>
      </main>
      <style>.modules-grid { display: grid; grid-template-columns: 1fr 1fr; }</style>
    `;
    const goodEval = await ai.evaluatePracticeCode({
      blockTitle: 'Блок 1. Семантическая вёрстка HTML5 и CSS Grid',
      taskInstructions: 'Используйте теги <main>, <article> и сетку CSS Grid',
      expectedPatterns: ['<main', '<article', 'display:\\s*grid', 'grid-template-columns'],
      studentCode: validCode
    });

    expect(goodEval.score).toBe(100);
    expect(goodEval.passed).toBe(true);

    const incompleteEval = await ai.evaluatePracticeCode({
      blockTitle: 'Блок 1. Семантическая вёрстка HTML5 и CSS Grid',
      taskInstructions: 'Используйте теги <main>, <article> и сетку CSS Grid',
      expectedPatterns: ['<main', '<article', 'display:\\s*grid', 'grid-template-columns'],
      studentCode: '<div>Просто текст без семантики и без сетки</div>'
    });

    expect(incompleteEval.score).toBe(0);
    expect(incompleteEval.passed).toBe(false);
    expect(incompleteEval.feedback).toContain('требует доработки');
  });

  it('5. Экранирует XML-теги пользовательского ввода и возвращает контекстную подсказку ИИ-наставника', async () => {
    const escaped = ai.escapeXmlTag('<script>alert(1)</script>');
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');

    const hint = await ai.askAiTutor({
      blockTitle: 'Блок 3. Серверное программирование на Node.js и Express',
      theoryMarkdown: 'Использование express.json()',
      taskInstructions: 'Реализуйте POST-маршрут',
      studentQuestion: 'Почему возникает ошибка undefined при чтении тела запроса?'
    });

    expect(hint).toContain('Следующий шаг');
    expect(hint.length).toBeGreaterThan(40);
  });
});
