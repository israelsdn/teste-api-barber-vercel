export function converToIso(date: string) {
    const partesData = date.split('/')

    const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`

    const data = new Date(dataFormatada)

    return data.toISOString()
}
