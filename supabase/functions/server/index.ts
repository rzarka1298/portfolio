import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    // Remove /server prefix to get the actual path
    const path = url.pathname.replace('/server', '') || '/'

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Root endpoint
    if (path === '/') {
      return new Response(
        JSON.stringify({ 
          message: 'Portfolio Analytics API',
          endpoints: ['/api/health', '/api/contact', '/api/analytics/visit', '/api/analytics/summary']
        }),
        { headers: corsHeaders }
      )
    }

    // Health check endpoint
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
        { headers: corsHeaders }
      )
    }

    // Contact form endpoint
    if (path === '/api/contact' && req.method === 'POST') {
      const body = await req.json()
      const { name, email, subject, message } = body

      if (!name || !email || !subject || !message) {
        return new Response(
          JSON.stringify({ error: 'All fields are required' }),
          { status: 400, headers: corsHeaders }
        )
      }

      const contactId = crypto.randomUUID()
      const contactData = {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString(),
        id: contactId
      }

      // Store in portfolio_data table
      const { error } = await supabase
        .from('portfolio_data')
        .upsert({
          key: `contact:${contactId}`,
          value: contactData
        })

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to save contact' }),
          { status: 500, headers: corsHeaders }
        )
      }

      // Send email notification using Gmail SMTP
      try {
        const gmailUser = Deno.env.get('GMAIL_USER') // your Gmail address
        const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD') // Gmail App Password
        
        if (gmailUser && gmailPass) {
          const client = new SMTPClient({
            connection: {
              hostname: 'smtp.gmail.com',
              port: 587,
              tls: true,
              auth: {
                username: gmailUser,
                password: gmailPass,
              },
            },
          })

          await client.send({
            from: gmailUser,
            to: 'rugvedzarkar@gmail.com',
            subject: `Portfolio Contact: ${subject}`,
            content: 'text/html',
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
            `,
          })

          await client.close()
          console.log('Email sent successfully via Gmail SMTP')
        }
      } catch (emailError) {
        console.error('Email error:', emailError)
        // Don't fail the request if email fails
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contact form submitted successfully',
          id: contactId 
        }),
        { headers: corsHeaders }
      )
    }

    // Visit tracking endpoint
    if (path === '/api/analytics/visit' && req.method === 'POST') {
      const body = await req.json()
      const { page, referrer } = body

      const visitId = crypto.randomUUID()
      const visitData = {
        page: page || '/',
        referrer: referrer || 'direct',
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent') || 'Unknown'
      }

      // Store visit
      await supabase
        .from('portfolio_data')
        .upsert({
          key: `visit:${visitId}`,
          value: visitData
        })

      // Update daily count
      const today = new Date().toISOString().split('T')[0]
      const dailyKey = `daily_visits:${today}`
      
      // Get current count
      const { data: existing } = await supabase
        .from('portfolio_data')
        .select('value')
        .eq('key', dailyKey)
        .single()

      const currentCount = (existing?.value as number) || 0
      
      // Update count
      await supabase
        .from('portfolio_data')
        .upsert({
          key: dailyKey,
          value: currentCount + 1
        })

      return new Response(
        JSON.stringify({ success: true, message: 'Visit tracked' }),
        { headers: corsHeaders }
      )
    }

    // Analytics summary endpoint
    if (path === '/api/analytics/summary' && req.method === 'GET') {
      let totalVisits = 0

      // Get daily visit counts for last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const { data } = await supabase
          .from('portfolio_data')
          .select('value')
          .eq('key', `daily_visits:${dateStr}`)
          .single()

        const count = (data?.value as number) || 0
        totalVisits += count
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          metrics: { totalVisits }
        }),
        { headers: corsHeaders }
      )
    }

    // Default 404 for unknown endpoints
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})