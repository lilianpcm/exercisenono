// JavaScript mínimo do site: menu no celular e vídeos de demonstração.
// Sem JavaScript o site continua funcionando (menu aberto, ilustração START → FINISH no lugar do vídeo).
(function () {
  // ----- menu mobile -----
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ----- vídeos de demonstração -----
  // O vídeo só é baixado quando o card aparece na tela (ou quando a pessoa aperta "Play demo").
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var demos = document.querySelectorAll("[data-demo]");
  Array.prototype.forEach.call(demos, function (demo) {
    var video = demo.querySelector("video");
    var poses = demo.querySelector(".ex-poses");
    var button = demo.querySelector("[data-demo-toggle]");
    if (!video || !button) return;
    var label = button.querySelector("span");
    var userStopped = false;
    button.hidden = false;

    var wanted = false;
    // A ilustração fica na tela até o vídeo começar de verdade (sem caixa em branco enquanto carrega).
    video.addEventListener("playing", function () {
      if (!wanted) return;
      video.hidden = false;
      poses.style.visibility = "hidden";
    });
    function play() {
      wanted = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      label.textContent = "Show start and finish";
      button.setAttribute("aria-pressed", "true");
    }
    function stop() {
      wanted = false;
      video.pause();
      video.hidden = true;
      poses.style.visibility = "";
      label.textContent = "Play demo";
      button.setAttribute("aria-pressed", "false");
    }
    button.addEventListener("click", function () {
      if (!wanted) {
        userStopped = false;
        play();
      } else {
        userStopped = true;
        stop();
      }
    });

    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !userStopped) play();
            else if (!e.isIntersecting && wanted) video.pause();
          });
        },
        { threshold: 0.6 }
      ).observe(demo);
    }
  });
})();
