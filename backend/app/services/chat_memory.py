from collections.abc import Callable

from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI

from app.core.config import get_settings

_store: dict[str, InMemoryChatMessageHistory] = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in _store:
        _store[session_id] = InMemoryChatMessageHistory()
    return _store[session_id]


def build_conversation_chain() -> RunnableWithMessageHistory:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is missing.")

    llm = ChatOpenAI(
        model=settings.openrouter_chat_model,
        openai_api_base="https://openrouter.ai/api/v1",
        openai_api_key=settings.openrouter_api_key,
        default_headers={
            "HTTP-Referer": settings.openrouter_referer,
            "X-Title": settings.app_name,
        },
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    chain = prompt | llm

    return RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="history",
    )


class ChatMemoryService:
    def __init__(self, conversation_factory: Callable[[], RunnableWithMessageHistory] | None = None) -> None:
        self._conversation_factory = conversation_factory or build_conversation_chain
        self._conversation: RunnableWithMessageHistory | None = None

    @property
    def conversation(self) -> RunnableWithMessageHistory:
        if self._conversation is None:
            self._conversation = self._conversation_factory()
        return self._conversation

    def ask(self, question: str, session_id: str) -> str:
        response = self.conversation.invoke(
            {"input": question},
            config={"configurable": {"session_id": session_id}},
        )
        return response.content
