% Prolog file: prolog_logic.pl

:- use_module(library(http/json)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).

% Sample questions with hints
question(0, "What is the powerhouse of the cell?", "Mitochondria", ["Nucleus", "Chloroplast", "Ribosome"], "Found in cells, it generates energy.").
question(1, "Who painted the Mona Lisa?", "Leonardo da Vinci", ["Michelangelo", "Raphael", "Donatello"], "This painter is also known for his notebooks.").
question(2, "What is the capital of France?", "Paris", ["London", "Berlin", "Rome"], "Known as the City of Light.").

% Return a question by ID
find_question(ID, QuestionData) :-
    question(ID, QuestionText, CorrectAnswer, IncorrectAnswers, Hint),
    QuestionData = json([id=ID, question=QuestionText, correct=CorrectAnswer, incorrect=IncorrectAnswers, hint=Hint]).

% Return a random question
get_random_question(QuestionData) :-
    findall(ID, question(ID, _, _, _, _), IDs),
    random_member(ID, IDs),
    find_question(ID, QuestionData).

% HTTP handlers
:- http_handler(root(question), random_question_handler, []).

% Random question request handler
random_question_handler(_Request) :-
    get_random_question(QuestionData),
    reply_json(QuestionData).

% Start the Prolog server
start_server :- http_server(http_dispatch, [port(5000)]).
:- initialization(start_server).
