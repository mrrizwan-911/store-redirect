export async function isDisposableEmail(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.checkdisposable.email/v1/check?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CDE_KEY}`
        }
      }
    )

    if (!res.ok) {
      return false // fail open
    }

    const data = await res.json()
    return data.is_disposable === true
  } catch (error) {
    return false // fail open
  }
}
