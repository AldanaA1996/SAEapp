export const readFiles = (files: FileList, callback: (result: string) => void) => {
	if (files.length == 0) {
		return
	}
	let file = files[0]
	const fileReader = new FileReader()
	fileReader.onload = function () {
		if (fileReader.result) {
			const result = fileReader.result.toString()
			callback(result)
		}
	}
	fileReader.onerror = function () {
		console.warn("oops, something went wrong.")
	}
	fileReader.readAsDataURL(file)
}

export const base64ToFile = (base64: string, filename: string): File => {
	const arr = base64.split(",")
	const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
	const extension = mime.split("/")[1] || "jpg"
	const finalFilename = `${filename}.${extension}`
	const bstr = atob(arr[1])
	let n = bstr.length
	const u8arr = new Uint8Array(n)

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}

	return new File([u8arr], finalFilename, { type: mime })
}
