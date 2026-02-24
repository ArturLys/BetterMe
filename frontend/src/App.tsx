import { useEffect, useState } from 'react'
import { supabase } from './client'
import { Button } from './components/ui/button'

function App() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .limit(10)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className='min-h-screen bg-background text-foreground p-8'>
      <h1 className='text-3xl font-bold mb-4'>🛒 Supabase + Shadcn Test</h1>

      <div className='flex gap-3 mb-6'>
        <Button>Default</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='destructive'>Destructive</Button>
        <Button variant='outline'>Outline</Button>
        <Button variant='ghost'>Ghost</Button>
      </div>

      {loading && <p className='text-muted-foreground'>Loading orders...</p>}
      {error && <p className='text-destructive'>❌ {error}</p>}

      {!loading && !error && (
        <div className='rounded-lg border overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-muted'>
              <tr>
                {['ID', 'Kit', 'Status', 'Payment', 'Lat', 'Lon'].map((h) => (
                  <th key={h} className='text-left px-4 py-3 font-medium text-muted-foreground'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className='border-t hover:bg-muted/50 transition-colors'>
                  <td className='px-4 py-3 font-mono text-xs'>{o.id?.slice(0, 8)}...</td>
                  <td className='px-4 py-3'>{o.kit_type}</td>
                  <td className='px-4 py-3'>{o.order_status}</td>
                  <td className='px-4 py-3'>{o.payment_status}</td>
                  <td className='px-4 py-3'>{o.target_latitude}</td>
                  <td className='px-4 py-3'>{o.target_longitude}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-8 text-center text-muted-foreground'>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App
