# Pathology Report Analyzer

A modern web application for analyzing HL7/ORU pathology reports, highlighting high-risk results, and providing an intuitive interface for healthcare professionals.

## Features

- **ORU File Parsing**: Upload and parse HL7/ORU format pathology reports
- **Risk Analysis**: Automatically identify high and moderate risk test results
- **Patient Information Display**: Clear presentation of patient demographics
- **Interactive Results**: Expandable result cards with detailed information
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Accessibility**: Built with accessibility in mind

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI components
- **Lucide React**: Beautiful SVG icons

## Installation

1. Clone the repository:

\`\`\`bash
git clone https://github.com/yourusername/pathology-report-analyzer.git
cd pathology-report-analyzer
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload an ORU File**:
   - Click the "Select File" button
   - Choose an ORU format pathology report file
   - Click "Analyze Report"

2. **View Results**:
   - Patient information will be displayed at the top
   - Results are categorized into "High Risk" and "Moderate Risk" tabs
   - Click on any result card to expand and see more details
   - Use the "Expand All" button to expand all result cards at once

3. **Toggle Theme**:
   - Click the sun/moon icon in the top right to switch between light and dark mode

## Project Structure

\`\`\`
pathology-report-analyzer/
├── app/                  # Next.js App Router
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── header.tsx        # Application header
│   ├── mode-toggle.tsx   # Theme toggle
│   ├── oru-uploader.tsx  # File upload component
│   ├── patient-results.tsx # Results display
│   ├── theme-provider.tsx # Theme provider
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   ├── data-service.ts   # Data fetching service
│   ├── oru-parser.ts     # ORU file parser
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
\`\`\`

## Sample Data

The application comes with a sample diagnostic metrics dataset that is used to analyze test results. The metrics are loaded from a CSV file that contains reference ranges for various diagnostic tests.

To test the application, you can use any HL7/ORU format file. Sample ORU files can be found in the `samples` directory or created using HL7 message generators.

## ORU File Format

The application expects ORU files to follow the HL7 standard format with segments like:

- **MSH**: Message Header
- **PID**: Patient Identification
- **OBR**: Observation Request
- **OBX**: Observation/Result

Example segment:
\`\`\`
OBX|1|NM|14798-3^S Iron:^LN||8|umol/L^umol/L|5-30||||F|||202306101318
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
