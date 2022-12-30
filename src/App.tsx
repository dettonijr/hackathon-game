import { matchesPattern } from "@babel/types"
import { useEffect, useMemo, useState } from "react"
import "./App.css"

const GRID_SIZE_X = 10
const GRID_SIZE_Y = 7

type GridCell = "O" | "X" | "." | "P"

interface Position {
  row: number
  col: number
}

type Map = GridCell[][]

interface State {
  map: Map
  playerPosition: Position
}

enum MovementDirection {
  up = "up",
  down = "down",
  left = "left",
  right = "right",
}

const checkOutside = (position: Position): boolean => {
  const { row, col } = position
  return row < 0 || row >= GRID_SIZE_Y || col < 0 || col >= GRID_SIZE_X
}

const checkCollision = (position: Position, state: State): boolean => {
  const { row, col } = position
  return state.map[row][col] === "O"
}

const getNewPosition = (direction: MovementDirection, playerPosition: Position): Position => {
  const { row, col } = playerPosition

  switch (direction) {
    case MovementDirection.up:
      return { row: row - 1, col }
    case MovementDirection.down:
      return { row: row + 1, col }
    case MovementDirection.left:
      return { row, col: col - 1 }
    case MovementDirection.right:
      return { row, col: col + 1 }
    default:
      return { row, col }
  }
}

const transition = (direction: MovementDirection, state: State) => {
  const { playerPosition } = state

  const newPos = getNewPosition(direction, playerPosition)

  if (checkOutside(newPos)) return state
  if (checkCollision(newPos, state)) return state

  const newState = { ...state }

  newState.playerPosition = { row: newPos.row, col: newPos.col }

  return newState
}

const randomDirection = (): MovementDirection => {
  const directions = [MovementDirection.up, MovementDirection.down, MovementDirection.left, MovementDirection.right]
  const randomIndex = Math.floor(Math.random() * directions.length)
  return directions[randomIndex]
}

const generateRandomPosition = (): Position => {
  const row = Math.floor(Math.random() * GRID_SIZE_Y)
  const col = Math.floor(Math.random() * GRID_SIZE_X)
  return { row, col }
}

const generateMap = (): Map => {
  const map = Array(GRID_SIZE_Y)
    .fill(null)
    .map(() => Array(GRID_SIZE_X).fill("."))

  for (var i = 0; i < 10; i++) {
    const randomPosition = generateRandomPosition()
    map[randomPosition.row][randomPosition.col] = "O"
  }

  const prizePosition = generateRandomPosition()
  map[prizePosition.row][prizePosition.col] = "X"

  return map
}

const checkWin = (state: State): boolean => {
  const { playerPosition, map } = state
  return map[playerPosition.row][playerPosition.col] === "X"
}

const reverseDirection = (direction: MovementDirection): MovementDirection => {
  switch (direction) {
    case MovementDirection.up:
      return MovementDirection.down
    case MovementDirection.down:
      return MovementDirection.up
    case MovementDirection.left:
      return MovementDirection.right
    case MovementDirection.right:
      return MovementDirection.left
    default:
      return direction
  }
}

class Runner {
  visited: Set<string>
  stack: MovementDirection[]

  constructor() {
    this.visited = new Set<string>()
    this.stack = []
  }

  nextMove = (state: State) => {
    const { visited, stack } = this
    const winner = checkWin(state)
    if (winner) {
      return
    }

    visited.add(`${state.playerPosition.row}-${state.playerPosition.col}`)

    const newDirection = Object.values(MovementDirection).find((direction) => {
      const newPos = getNewPosition(direction, state.playerPosition)
      return !checkOutside(newPos) && !checkCollision(newPos, state) && !visited.has(`${newPos.row}-${newPos.col}`)
    })

    if (newDirection) {
      stack.push(newDirection)
      return newDirection
    } else {
      const lastDirection = stack.pop()
      if (lastDirection) {
        return reverseDirection(lastDirection)
      }
    }
  }
}

function App() {
  const [state, setState] = useState<State>({
    map: generateMap(),
    playerPosition: generateRandomPosition(),
  })
  const { map, playerPosition } = state

  const nextState = (direction: MovementDirection) => {
    const newState = transition(direction, state)
    setState(newState)
  }

  const winner = checkWin(state)

  const runner = useMemo(() => new Runner(), [])

  const runCycle = () => {
    const direction = runner.nextMove(state)

    if (direction) {
      nextState(direction)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {winner && <h1>You won!</h1>}
        <div className="grid">
          {map.map((row, rowIndex) => (
            <>
              <div key={rowIndex} className="grid-row">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`grid-cell ${
                      playerPosition.row === rowIndex && playerPosition.col === cellIndex ? "player" : ""
                    }`}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </>
          ))}
        </div>
        <button onClick={runCycle}>Move</button>
        {Object.values(MovementDirection).map((direction) => (
          <button
            onClick={() => {
              nextState(direction)
            }}
          >
            {direction}
          </button>
        ))}
      </header>
    </div>
  )
}

export default App
