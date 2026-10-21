/**
 * Чистая бизнес-логика без обращений к сети и базе данных.
 * Вынесена отдельно, чтобы её можно было покрыть модульными тестами.
 */

const QUIZ_PASS_SCORE = 70;

/**
 * Оценка теста: процент совпадений ответов студента с правильными вариантами.
 * S = round(K / N * 100), где K - число верных ответов, N - число вопросов.
 */
function scoreQuiz(questions, answers) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw httpError(400, 'В блоке нет тестовых вопросов');
  }
  const list = Array.isArray(answers) ? answers : [];
  let correct = 0;
  const details = questions.map((question, i) => {
    const chosen = Number.isInteger(list[i]) ? list[i] : -1;
    const isCorrect = chosen === question.correct_index;
    if (isCorrect) correct += 1;
    return {
      question_id: question.id,
      chosen,
      correct_index: question.correct_index,
      is_correct: isCorrect,
      explanation: question.explanation
    };
  });
  const score = Math.round((correct / questions.length) * 100);
  return { score, passed: score >= QUIZ_PASS_SCORE, correct, total: questions.length, details };
}

/**
 * Статус каждого блока для студента.
 * Блок пройден, если есть зачтённый тест и зачтённая практика.
 * Блок открыт, если он первый или предыдущий блок пройден.
 */
function computeBlockStates(blocks, quizAttempts, practiceSubmissions) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const states = [];
  let previousCompleted = true;

  for (const block of sorted) {
    const quizzes = quizAttempts.filter((a) => a.block_id === block.id);
    const practices = practiceSubmissions.filter((s) => s.block_id === block.id);
    const bestQuiz = quizzes.reduce((max, a) => Math.max(max, a.score), -1);
    const bestPractice = practices.reduce((max, s) => Math.max(max, s.score), -1);
    const quizPassed = quizzes.some((a) => a.passed);
    const practicePassed = practices.some((s) => s.passed);
    const completed = quizPassed && practicePassed;
    const unlocked = previousCompleted;

    states.push({
      block_id: block.id,
      unlocked,
      completed,
      quiz_passed: quizPassed,
      practice_passed: practicePassed,
      best_quiz_score: bestQuiz >= 0 ? bestQuiz : null,
      best_practice_score: bestPractice >= 0 ? bestPractice : null
    });
    previousCompleted = completed;
  }
  return states;
}

function progressPercent(states) {
  if (!states.length) return 0;
  return Math.round((states.filter((s) => s.completed).length / states.length) * 100);
}

/**
 * Проверка и нормализация плана курса, присланного преподавателем
 */
function normalizeOutline(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw httpError(400, 'В плане курса должен быть хотя бы один блок');
  }
  if (blocks.length > 12) {
    throw httpError(400, 'В курсе может быть не более 12 блоков');
  }
  return blocks.map((b, i) => {
    const title = String(b?.title || '').trim();
    if (!title) throw httpError(400, `У блока №${i + 1} не указано название`);
    return {
      id: b.id || null,
      position: i + 1,
      title: title.slice(0, 200),
      goal: String(b?.goal || '').trim().slice(0, 1000)
    };
  });
}

/**
 * Код приглашения в курс: 6 символов без похожих букв и цифр (0/O, 1/I)
 */
function generateInviteCode(random = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(random() * alphabet.length)];
  }
  return code;
}

/**
 * Экранирование пользовательского текста перед вставкой в XML-теги промпта
 */
function escapeXml(text = '') {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = {
  QUIZ_PASS_SCORE,
  scoreQuiz,
  computeBlockStates,
  progressPercent,
  normalizeOutline,
  generateInviteCode,
  escapeXml,
  httpError
};
