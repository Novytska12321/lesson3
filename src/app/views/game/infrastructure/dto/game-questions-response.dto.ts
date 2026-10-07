export type GameQuestionDto = {
  type: 'multiple' | 'boolean'
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

export type GameQuestionsResponseDto = {
  response_code: number
  results: GameQuestionDto[]
}