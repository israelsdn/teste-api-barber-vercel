export function toCompareDates(dataStr: Date): boolean {
    const currentDate = new Date()

    const providedDate = dataStr && new Date(dataStr)

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentDay = currentDate.getDate()

    const providedYear = providedDate?.getUTCFullYear()
    const providedMonth = providedDate?.getUTCMonth() + 1
    const providedDay = providedDate?.getUTCDate()

    return (
        currentYear === providedYear &&
        currentMonth === providedMonth &&
        currentDay === providedDay
    )
}
