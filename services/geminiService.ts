
import { GoogleGenAI } from "@google/genai";

export const generateAbsenceEmail = async (
  studentName: string, 
  reason: 'consecutive' | 'total' | 'daily', 
  days: number,
  senderName: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  
  if (reason === 'daily') {
    prompt = `
      Escreva um e-mail curto, atencioso e formal para ser enviado aos PAIS ou RESPONSÁVEIS de um aluno que faltou à aula HOJE.
      
      Detalhes:
      Nome do Aluno: ${studentName}
      Remetente: ${senderName} (Equipe de Disciplina)
      
      O tom deve ser informativo e de cuidado, perguntando se está tudo bem e lembrando que a escola sentiu a falta do aluno.
      Retorne APENAS o corpo do texto, sem assunto ou campos extras.
    `;
  } else if (reason === 'consecutive') {
    prompt = `
      Escreva um e-mail urgente e profissional para a EQUIPE PEDAGÓGICA sobre um aluno com ${days} faltas consecutivas.
      
      Detalhes:
      Aluno: ${studentName}
      Remetente: ${senderName}
      
      Solicite uma averiguação pedagógica e contato com a família para evitar a evasão escolar.
      Retorne APENAS o corpo do texto.
    `;
  } else {
    prompt = `
      Escreva um e-mail de alerta crítico para a EQUIPE PEDAGÓGICA e ASSISTENTES SOCIAIS.
      
      Detalhes:
      Aluno: ${studentName}
      Situação: Acumulou um total de ${days} faltas alternadas.
      Remetente: ${senderName}
      
      O tom deve ser de alerta grave para risco de abandono escolar, solicitando intervenção social e pedagógica.
      Retorne APENAS o corpo do texto.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating email:", error);
    return `Informamos que o aluno ${studentName} registrou ${days} falta(s) (${reason === 'consecutive' ? 'consecutivas' : 'totais'}). Favor verificar a situação. Atenciosamente, ${senderName}.`;
  }
};
