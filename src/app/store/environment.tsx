import { create } from "zustand"
import { persist } from "zustand/middleware"

type EnvironmentState = {
	baseApiUrl: string
	setBaseApiUrl: (url: string) => void
}

export const useEnvironmentStore = create<EnvironmentState>()(
	persist(
		(set, get) => ({
			baseApiUrl: "",
			setBaseApiUrl: (url) => set({ baseApiUrl: url })
		}),
		{
			name: "environment"
		}
	)
)
