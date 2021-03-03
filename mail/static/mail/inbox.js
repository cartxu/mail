document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //Cuando el usuario haga click en submit:
   document.querySelector('form').onsubmit = () => send_email(); 

}

function send_email() {

  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({recipients: recipients,
                          subject: subject,
                          body: body
                        })
    })
    .then(response => response.json())
    .then(result => {
            console.log(result);
            load_mailbox('sent');
    });

    return false;
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Mostrar el titulo de cada bandeja 
  const titleMailbox = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  const emailsView = document.querySelector('#emails-view');
  const emailBody = document.querySelector('#email-view');
  emailBody.innerHTML = ' '; //Borramos el contenido de email-view para solo ver 1 email a la vez
  
  // Show the mailbox name
  emailsView.innerHTML = titleMailbox;

  //GET request to get the emails
    fetch(`/emails/${mailbox}`) 
    .then(response => response.json())
    .then(emails => {
        if (emails.length == 0) {
          let message = document.createElement("div");
          message.innerHTML = "No emails here yet.";
          emailsView.appendChild(message);

        } else {
          // Si hay emails, recorremos el array y los vamos añadiendo al div 

            emails.forEach((email) => {

            let mailDiv = document.createElement("div");

            // Extraemos el asunto de email para capitalizarlo

            let subject = email.subject;
            let read = email.read;
            let subjectCap = `${subject.charAt(0).toUpperCase() + subject.slice(1)}`;
            mailDiv.className = "table-light";
            mailDiv.style = "border: 1px solid #DEDEDE; padding: 10px; cursor: pointer;"

            // Cuando hacemos click en un email vemos su contenido:

            mailDiv.addEventListener('click', function() {
              document.querySelector('#emails-view').style.display = 'none';
              document.querySelector('#compose-view').style.display = 'none';
              document.querySelector('#email-view').style.display = 'block';
              const emailContent = document.createElement("div");
              
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({ read: true })
              })

              fetch(`/emails/${email.id}`)
              .then(response => response.json())
              .then(email => {
                emailContent.innerHTML = `<div class="email-title"><h4> ${subjectCap} </h4></div>
                                          <div class="email-info"> <div> From: <strong>${email.sender.split("@",1)} </strong> < ${email.sender} > to ${email.recipients}</div> <div>${email.timestamp}</div> </div>
                                          <div class="email-body"> ${email.body} </div>`

                
                // responder al email
                const reply = document.createElement('button');
                reply.className = "btn btn-info";
                reply.id = "reply";
                reply.textContent = "Reply";
                emailContent.appendChild(reply);

                reply.addEventListener('click', () => {

                compose_email();

                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-subject').value = email.subject.slice(0,4) == 'Re: ' ? 'Re: ' + email.subject.slice(4,) : 'Re: ' + email.subject;
                document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote "${email.body}" 

`;
                });

              if (mailbox != 'sent'){
              //archivar correos
                if (email.archived == false) { //Comprobamos si el email está archivado o no para mostrar boton archivar o desarchivar

                  const archive = document.createElement('button');
                  archive.className ="btn btn-info margin";
                  archive.id = "archive";
                  archive.textContent = "Archive";
                  emailContent.appendChild(archive);

                  archive.addEventListener('click', () => { //archivamos
                    fetch(`/emails/${email.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({ archived: true })
                    })
                    load_mailbox('inbox');
                  });

                } else { //mostramos boton desarchivar

                  const unarchive = document.createElement('button');
                  unarchive.className ="btn btn-info margin";
                  unarchive.id = "unarchive";
                  unarchive.textContent = "Unarchive";
                  emailContent.appendChild(unarchive);

                  unarchive.addEventListener('click', () => { //desarchivamos
                    fetch(`/emails/${email.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({ archived: false })
                    })
                    load_mailbox('inbox');
                  });
                }
            }
              emailBody.appendChild(emailContent);
              
              
            });
          })
            // Comprobamos en qué bandeja de entrada estamos para mostrar una información u otra.
            // Mostramos los destinatarios en enviados y en inbox, quien nos lo envia.
            // Si la bandeja es la de 'Sent':
              if (mailbox == 'sent'){
                mailDiv.innerHTML = `<i class="fas fa-angle-double-right"></i> <strong>${subjectCap}</strong> to <strong>${email.recipients}</strong> - ${email.timestamp}`;
                emailsView.appendChild(mailDiv);
              }
            // Si estamos en inbox, tendremos que comprobar si el email ha sido leido o no para cambiar color de fondo:
              if (mailbox == 'inbox') {
                  mailDiv.innerHTML = `<i class="fas fa-angle-double-right"></i> <strong>${subjectCap}</strong> from <strong>${email.sender}</strong> - ${email.timestamp}`;
                  emailsView.appendChild(mailDiv);
                  if (read == true) {
                    mailDiv.classList.remove("table-light");
                    mailDiv.classList.add("table-secondary");
                  }
              }
            // Si estamos en archive
              if (mailbox == 'archive') {
                mailDiv.innerHTML = `<i class="fas fa-angle-double-right"></i> <strong>${subjectCap}</strong> from <strong>${email.sender}</strong> - ${email.timestamp}`;
                emailsView.appendChild(mailDiv);
              
              }

              
        });
      }
    });
  


  



}