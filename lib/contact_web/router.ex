defmodule ContactWeb.Router do
  use ContactWeb, :router

  pipeline :api do
    plug(:accepts, ["json-api"])
    plug(JaSerializer.ContentTypeNegotiation)
    plug(JaSerializer.Deserializer)
  end

  pipeline :api_auth do
    plug(ContactWeb.Guardian.AuthPipeline)
  end

  scope "/api", ContactWeb.Api do
    pipe_through(:api)

    scope "/v1", V1 do
      resources("/users", UserController, only: [:create])
      post("/users/sign_in", UserController, :sign_in)
    end
  end

  scope "/api", ContactWeb.Api do
    pipe_through([:api, :api_auth])

    scope "/v1", V1 do
      resources "/users", UserController, only: [:update, :show, :delete] do
        get("/teams/:team_id/rooms", User.Team.RoomController, :index)
      end

      resources "/teams", TeamController, only: [:create, :update, :delete, :show] do
        resources("/users", Team.UserController, only: [:create, :delete])
      end

      resources "/rooms", RoomController, only: [:create, :update, :show, :delete] do
        resources("/users", Room.UserController, only: [:create, :delete])
        resources("/messages", Room.MessageController, only: [:index])
      end
    end
  end
end
